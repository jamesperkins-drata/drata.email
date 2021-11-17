const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const AWS = require('aws-sdk');
const simpleParser = require('mailparser').simpleParser;
const winston = require("winston");
var Mixpanel = require('mixpanel');

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


var s3 = new AWS.S3();
var bucketName = process.env.BUCKET;

const baseHandler = async (event) => {
    logger.defaultMeta = { requestId: event.requestContext.requestId, principal: event.requestContext.authorizer.principalId };
    logger.info("Get mail requested.", { mailbox: event.pathParameters.email, mailid: event.pathParameters.id })
    mixpanel.track("Get mail", {distinct_id:event.requestContext.authorizer.principalId, mailbox: event.pathParameters.email})
    try {                
        var getParams = {
            Bucket: bucketName,
            Key: event.pathParameters.email+"/"+event.pathParameters.id
        }
        var obj = await s3.getObject(getParams).promise()
        let parsed = await simpleParser(obj.Body)
        return {
            statusCode: 200,
            body: JSON.stringify(parsed)
        }
    }
    catch(error){
        console.error("Unable to process get request",{error: error})
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