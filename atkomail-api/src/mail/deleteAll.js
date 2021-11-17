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
    logger.defaultMeta = { requestId: event.requestContext.requestId, principal: event.requestContext.authorizer.principalId };
    logger.info("Delete all mail requested.", { mailbox: event.pathParameters.email })
    mixpanel.track("Delete mail", {distinct_id:event.requestContext.authorizer.principalId, mailbox: event.pathParameters.email})
    var listParams = {
        Bucket: bucketName, 
        Delimiter: '/',
        MaxKeys: 100,
        Prefix: event.pathParameters.email+"/"
       };

    try {
        var result = await s3.listObjectsV2(listParams).promise()
        if(result.Contents.length == 0){
            logger.debug("Mailbox was already empty.")
            return {
                statusCode: 200
            }
        }
        else{
            logger.debug("Mail box contained "+result.Contents.length+" nested elements.")
            //all nested objects must be removed first
            for (let index = 0; index < result.Contents.length; index++) {
                const element = result.Contents[index];
                var deleteParams = {
                    Bucket: bucketName,
                    Key: element.Key
                }
                await s3.deleteObject(deleteParams).promise()
            }
            var deleteParams = {
                Bucket: bucketName,
                Key: event.pathParameters.email
            }
            await s3.deleteObject(deleteParams).promise()
            return {
                statusCode: 200
            }
        }
    }
    catch(error){
        console.error("Unable to process deleteall request",{error: error})
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