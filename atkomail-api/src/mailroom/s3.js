var AWS = require('aws-sdk');
var s3 = new AWS.S3();
const winston = require("winston");
var bucketName = process.env.BUCKET;

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

module.exports.sort = async (event) => {
    var sesNotification = event.Records[0].ses;
    logger.info("Processing mail",{
        messageId: sesNotification.mail.messageId,
        source: sesNotification.mail.source,
        subject: sesNotification.mail.commonHeaders.subject,
        destination: sesNotification.mail.destination[0], 
        mailbox: sesNotification.mail.destination[0].split('@')[0],
        domain: sesNotification.mail.destination[0].split('@')[1]})
    var copyParams = {
        Bucket: bucketName, 
        CopySource: bucketName+"/"+sesNotification.mail.messageId, 
        Key: sesNotification.mail.destination[0]+"/"+sesNotification.mail.messageId
       };

    await s3.copyObject(copyParams).promise()

    var deleteParams = {
        Bucket: bucketName,
        Key: sesNotification.mail.messageId, 
    }
    await s3.deleteObject(deleteParams).promise()
}