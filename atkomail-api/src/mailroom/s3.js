var AWS = require('aws-sdk');
var s3 = new AWS.S3();
const winston = require("winston");
var bucketName = process.env.BUCKET;
const notificationsDB = new AWS.DynamoDB.DocumentClient()
const apiGateway = new AWS.ApiGatewayManagementApi({endpoint: "1uoy7q9beh.execute-api.us-east-1.amazonaws.com/dev"})

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

module.exports.sort = async (event) => {
    try {
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
            Key: sesNotification.mail.destination[0]+"/"+Date.now()+"-"+Math.floor(Math.random() * 1000)
           };
    
        await s3.copyObject(copyParams).promise()
    
        var deleteParams = {
            Bucket: bucketName,
            Key: sesNotification.mail.messageId, 
        }
        await s3.deleteObject(deleteParams).promise()
        
    } catch (error) {
        logger.error("Unable to sort mail", {error: error})
    }

    try{
        //update any clients waiting on this box
        var params = {
            TableName: process.env.DYNAMO_TABLE_NAME,
            FilterExpression: "#mb = :mailbox",
            ExpressionAttributeNames:{
                "#mb": "mailbox"
            },
            ExpressionAttributeValues: {
                ":mailbox": sesNotification.mail.destination[0]
            }
        }
        
        var response = await notificationsDB.scan(params).promise()
        response.Items.forEach(async function (item){
            logger.info(item)
            await apiGateway.postToConnection({ConnectionId:item.connectionId,Data:"refresh your box"}).promise()
        })
    } catch (error) {
        console.error("Unable to notify of mail changes", {error: error})
    }
}