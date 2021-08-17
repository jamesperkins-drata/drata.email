const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const AWS = require('aws-sdk');
const winston = require("winston");

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
    logger.info("Delete mail requested.", { mailbox: event.pathParameters.email, mailid: event.pathParameters.id })
    try {                
        var deleteParams = {
            Bucket: bucketName,
            Key: event.pathParameters.email+"/"+event.pathParameters.id
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