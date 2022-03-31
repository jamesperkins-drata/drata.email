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
        if(event.pathParameters.domain == null || event.pathParameters.domain == null){
            console.error("Unable to process list request",{error: error})
            return{
                status: 400,
                error: "Missing path parameter."
            }
        }
        if(event.requestContext.authorizer == null || event.requestContext.authorizer.uid == null){
            console.error("Unable to process list request",{error: error})
            return{
                status: 500,
                error: "Missing user identifier."
            }
        }

        mixpanel.track("Remove domain request.", {distinct_id:event.requestContext.authorizer.principalId, doamin: event.pathParameters.domain})

        logger.debug("query",{owner:event.requestContext.authorizer.uid, domain:event.pathParameters.domain})

        var params = {
            TableName: process.env.DOMAINS_TABLE_NAME,
            KeyConditionExpression: "#o = :owner and #d = :domain",
            ExpressionAttributeNames:{
                "#o": "owner",
                "#d": "domain"
            },
            ExpressionAttributeValues: {
                ":owner": event.requestContext.authorizer.uid,
                ":domain":  event.pathParameters.domain
            }
        }

        var response = await dynamoClient.query(params).promise()

        if(response.Items.length == 0){
            logger.warn("Domain requested for removal was not registered.", {domain: event.pathParameters.domain})
            return {
                statusCode: 200
            }
        }
        if(response.Items.length > 1){
            logger.error("Domain requested for removal was registered multiple times", {domain: event.pathParameters.domain})
            return {
                statusCode: 500
            }
        }
        
        //verify the owner is the requester
        logger.debug("Owner is requester",{domainRecord: response.Items})

        //remove ses identity
        var deleteDomain = await new AWS.SES({apiVersion: '2010-12-01'}).deleteIdentity({Identity: event.pathParameters.domain}).promise();
        logger.debug("SES stage completed", {sesResponse: deleteDomain})

        //remove okta group
        const privateKey = await oktaPrivateKeyPromise;
        const client = new okta.Client({
            orgUrl: 'https://account.atko.email',
            authorizationMode: 'PrivateKey',
            clientId: process.env.CLIENT_ID,
            scopes: ['okta.groups.manage','okta.users.read'],
            privateKey: privateKey.Parameter.Value
        });

        await client.deleteGroup(response.Items[0].groupId)
        logger.debug("Okta group stage completed")

        //remove domain table entry
        const deleteParams = {
            TableName: process.env.DOMAINS_TABLE_NAME,
            Key:{
                    'owner': event.requestContext.authorizer.uid,
                    'domain': event.pathParameters.domain
                }
        }

        await dynamoClient.delete(deleteParams).promise()
        logger.debug("Dynamo stage completed")
        return {
            statusCode: 200
        }
    }
    catch(error){
        logger.error("Unable to process remove domain request",{error: error})
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