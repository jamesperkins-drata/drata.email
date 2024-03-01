const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const AWS = require('aws-sdk');
const dynamoClient = new AWS.DynamoDB.DocumentClient()
const winston = require("winston");
var Mixpanel = require('mixpanel');
const okta = require('@okta/okta-sdk-nodejs');

var mixpanel = Mixpanel.init(
    process.env.MIX_PANEL_TOKEN,
    {
      host: "api-eu.mixpanel.com",
    },
  );

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

const ssm = new AWS.SSM();
const oktaPrivateKeyPromise = ssm
  .getParameter({
    Name: process.env.EVENT_SERVICE_SECRET_NAME,
    WithDecryption: true
  })
  .promise()

const baseHandler = async (event) => {
    logger.defaultMeta = { requestId: event.requestContext.requestId, principal: event.requestContext.authorizer.principalId };

    try {       
        if(!event.body){
            return {
                statusCode: 400,
                body: JSON.stringify({
                    msg: "No payload provided."
                })
            }
        }
        var payload = JSON.parse(event.body)

        if(!payload.domain){
            return {
                statusCode: 400,
                body: JSON.stringify({
                    msg: "No domain provided."
                })
            }
        }

        mixpanel.track("Add domain request.", {distinct_id:event.requestContext.authorizer.principalId, doamin: payload.domain})

        var params = {
            TableName: process.env.DOMAINS_TABLE_NAME,
            FilterExpression: "#domain = :domain",
            ExpressionAttributeNames:{
                "#domain": "domain"
            },
            ExpressionAttributeValues: {
                ":domain": payload.domain
            }
        }

        var response = await dynamoClient.scan(params).promise()

        if(response.Items.length > 0){
            logger.warn("Domain requested for registration already registered.", {domain: payload.domain})
            return {
                statusCode: 409,
                body: JSON.stringify({
                    msg: "Domain is already registered."
                })
            }
        }
        logger.debug("Domain is not already registered")

        //create verification string
        var verifyDomain = await new AWS.SES({apiVersion: '2010-12-01'}).verifyDomainIdentity({Domain: payload.domain}).promise();
        logger.debug("SES stage completed", {sesResponse: verifyDomain})

        //create okta group
        const privateKey = await oktaPrivateKeyPromise;
        const client = new okta.Client({
            orgUrl: 'https://login.drata.email',
            authorizationMode: 'PrivateKey',
            clientId: process.env.CLIENT_ID,
            scopes: ['okta.groups.manage','okta.users.read'],
            privateKey: privateKey.Parameter.Value
        });

        const groupPayload = {
            profile: {
              name: 'mailbox:'+payload.domain
            }
          };

        var group = await client.createGroup(groupPayload)
        var user = await client.getUser(event.requestContext.authorizer.uid)
        await user.addToGroup(group.id)
        logger.debug("Okta group stage completed")

        //record the domain on the table to track owner
        const createParams = {
            TableName: process.env.DOMAINS_TABLE_NAME,
            Item:{
                    'owner': event.requestContext.authorizer.uid,
                    'domain': payload.domain,
                    'groupId': group.id,
                    'created': Date.now()
                }
        }
        await dynamoClient.put(createParams).promise()
        logger.debug("Dynamo stage completed")
        return {
            statusCode: 200,
            body: JSON.stringify({
                VerificationToken: verifyDomain.VerificationToken
            })
        }
    }
    catch(error){
        logger.error("Unable to process add domain request",{error: error})
        return{
            status: 500,
            error: "Something failed, sorry."
        }
    }

}

const handler = middy(baseHandler)
.use(cors({
    credentials: true,
    origins: process.env.ORIGINS.split(' ')
}))

module.exports = {handler}