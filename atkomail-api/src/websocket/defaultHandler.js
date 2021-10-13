const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const AWS = require('aws-sdk');
const winston = require("winston");
const notificationsDB = new AWS.DynamoDB.DocumentClient()

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

const baseHandler = async (event) => {
    logger.defaultMeta = { connectionId: event.requestContext.connectionId };
    logger.info("Event.", { event: event })
    logger.info("payload", {payload: JSON.parse(event.body)})
    var mailbox = JSON.parse(event.body).mailbox
    const connectionId = event.requestContext.connectionId
    const params = {TableName: process.env.DYNAMO_TABLE_NAME,
        Key: {'connectionId': connectionId},
        UpdateExpression: "set mailbox = :m",
        ExpressionAttributeValues:{
            ":m": mailbox
        }
    }
    try{
        await notificationsDB.update(params).promise()
        return {
            statusCode: 200,
            body: 'ack'
        }
    }
    catch(e){
        logger.error("Unable to update dynamo", {error: e})
        return {
            statusCode: 500,
            body: 'Unable'
        }
    }
}

const handler = middy(baseHandler)
.use(cors({
    credentials: true,
    origins: process.env.ORIGINS.split(' ')
}))

module.exports = {handler}