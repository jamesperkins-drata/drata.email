const winston = require("winston");

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

//This handler implements the required verification logic for Okta Event Hooks
//Product docs: https://developer.okta.com/docs/concepts/event-hooks/#one-time-verification-request
module.exports.handler = async (event) => {
    logger.debug("verification called",{event:event})
    for (const [key, value] of Object.entries(event.headers)){
        if(key === 'X-Okta-Verification-Challenge'){
            logger.info("Okta event hook verification requested.",{path: event.path})
            let jsonToken = {}
            jsonToken["verification"] = value
            return {
                statusCode: 200,
                body: JSON.stringify(jsonToken)
            }
        }
    }
    logger.warn("Call made to verification without 'x-okta-verification-challenge' header")
    return {
        statusCode: 400,
        error: "Required header missing."
    }
}