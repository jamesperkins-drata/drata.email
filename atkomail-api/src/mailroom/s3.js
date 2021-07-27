var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var bucketName = process.env.BUCKET;

module.exports.sort = async (event) => {
    var sesNotification = event.Records[0].ses;
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