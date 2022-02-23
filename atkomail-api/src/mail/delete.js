const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const AWS = require('aws-sdk');
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
    if(event.pathParameters.email == null || event.pathParameters.id == null){
        console.error("Unable to process list request",{error: error})
        return{
            status: 400,
            error: "Missing path parameter."
        }
    }
    var mailbox = event.pathParameters.email.toLowerCase()
    var mailid = event.pathParameters.id

    logger.defaultMeta = { requestId: event.requestContext.requestId, principal: event.requestContext.authorizer.principalId };
    logger.info("Delete mail requested.", { mailbox: mailbox, mailid: mailid })
    mixpanel.track("Delete mail", {distinct_id:event.requestContext.authorizer.principalId, mailbox: mailbox, mailid: mailid})
    try {                
        var deleteParams = {
            Bucket: bucketName,
            Key: mailbox+"/"+mailid
        }
        await s3.deleteObject(deleteParams).promise()
        return {
            statusCode: 200,
        }
    }
    catch(error){
        console.error("Unable to process delete request",{error: error})
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