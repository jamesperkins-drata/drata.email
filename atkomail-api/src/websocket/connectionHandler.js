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
    logger.info("ConnectionManagement event.", { event: event.requestContext.eventType })
    if(event.requestContext.eventType === "DISCONNECT"){
        try{
            await notificationsDB.delete({TableName: process.env.DYNAMO_TABLE_NAME, Key: {connectionId}}).promise()
            return {
                statusCode: 200,
                body: 'Disconnected'
            }
        } catch(e){
            logger.error("Unable to update dynamo", {error: e.message})
            return {
                statusCode: 500,
                body: 'Unable'
            }
        }

    }
    else if(event.requestContext.eventType === "CONNECT"){
        const connectionId = event.requestContext.connectionId
        const params = {TableName: process.env.DYNAMO_TABLE_NAME,
        Item:{
                'connectionId': connectionId,
                ttl: parseInt((Date.now() / 1000) + 3600)
            }
        }
        try{
            await notificationsDB.put(params).promise()
            return {
                statusCode: 200,
                body: 'Connected'
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
    else {
            return {
                statusCode: 500,
                body: 'Unknown event'
            }
    }
}

const handler = middy(baseHandler)
.use(cors({
    credentials: true,
    origins: process.env.ORIGINS.split(' ')
}))

module.exports = {handler}