const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const simpleParser = require('mailparser').simpleParser;
const AWS = require('aws-sdk');
var md5 = require("md5"); 
const winston = require("winston");
var s3 = new AWS.S3();

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

var bucketName = process.env.BUCKET;

const baseHandler = async (event) => {
    logger.defaultMeta = {requestId: event.requestContext.requestId, principal: event.requestContext.authorizer.principalId};
    logger.info("Request for "+event.pathParameters.email)
    var listParams = {
        Bucket: bucketName, 
        Delimiter: '/',
        MaxKeys: 100,
        Prefix: event.pathParameters.email+"/"
       };

    try {
        var result = await s3.listObjectsV2(listParams).promise()
        if(result.Contents.length == 0){
            logger.debug("Empty mailbox")
            return {
                statusCode: 200,
                body: JSON.stringify({
                    messages: []
                })
            }
        }
        else{
            logger.debug("Mailbox size of "+result.Contents.length)
            var messages = []
            for (let index = 0; index < result.Contents.length; index++) {
                const element = result.Contents[index];
                try{
                    var getParams = {
                        Bucket: bucketName,
                        Key: element.Key
                    }
                    var obj = await s3.getObject(getParams).promise()
                    let parsed = await simpleParser(obj.Body)
                    var mail = {
                        id: element.Key,
                        from: parsed.from,
                        avatar: 'https://www.gravatar.com/avatar/'+md5(parsed.from.value[0].address)+'?d=mp',
                        date: parsed.date,
                        subject: parsed.subject,
                        attachmentCount: parsed.attachments.length
                    }
                    messages.push(mail)
                } catch(error){
                    console.error("Failed to read message",error)
                }
            }
            logger.debug("Returning "+messages.length+" items")
            return {
                statusCode: 200,
                body: JSON.stringify({
                    //reverse to place messages in latest first order
                    //assumes mail id increments within a given mailbox
                    messages: messages.reverse()
                })
            }
        }
    }
    catch(error){
        console.error(error)
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