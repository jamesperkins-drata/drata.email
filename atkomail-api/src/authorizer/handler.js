"use strict";
const OktaJwtVerifier = require('@okta/jwt-verifier')
const winston = require("winston");

const baseVerifier = new OktaJwtVerifier({
    issuer: process.env.ISSUER,
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

exports.jwt = async (event) => {
    logger.debug("Incoming event",{event:event})
    try{
        var jwt = await baseVerifier.verifyAccessToken(parseTokenFromEvent(event), process.env.AUDIENCE)
        logger.debug("Successfully validated",{token:jwt})
        return generateAuthResponse(jwt.claims, 'Allow',  event.methodArn)
    } catch(err){
        logger.error("Token failed validation "+err, {error: err})
        return generateAuthResponse("unverified", 'Deny',  event.methodArn)
    }
}

exports.auth = async (event) => {
    logger.debug("Incoming event",{event:event})
    try {
        var jwt = await baseVerifier.verifyAccessToken(parseTokenFromEvent(event), process.env.AUDIENCE)
        logger.debug("Successfully validated",{token:jwt})
        const domains = jwt.claims.maildomains
        if(domains && domains.length > 0){
            const gatewayPath = event.methodArn.split(':')[5]
            var mailbox = gatewayPath.split('/')[4]
            var mailDomain = mailbox.split('@')[1]
            if(domains.includes("mailbox:"+mailDomain)){
                logger.debug("Successfully validated",{requestedDomain: mailDomain})
                var statement = generateAuthResponse(jwt.claims, 'Allow',  event.methodArn)
                logger.debug("statement gen",{statement: statement})
                return statement
            } else{
                logger.error("No mail domains available.",{maildomains: jwt.claims.maildomains, requestedDomain: mailDomain})
                return generateAuthResponse(jwt.claims, 'Deny',  event.methodArn)
            }
        }
        else {
            logger.error("No mail domains available.")
            return generateAuthResponse(jwt.claims, 'Deny',  event.methodArn)
        }
    }catch(err){
        logger.error("Token failed validation "+err, {error: err})
        return generateAuthResponse(null, 'Deny',  event.methodArn)
    };
};


exports.fixed = (event) => {
    if(event.authorizationToken == process.env.FIXED_AUTH_SECRET) {
        return generateAuthResponse(null, 'Allow',  event.methodArn)
    }
    else{
        return generateAuthResponse(null, 'Deny',  event.methodArn)
    }
}

function parseTokenFromEvent(event){
    return event.authorizationToken.split(' ')[1]
}

function generateAuthResponse(identity, effect, methodArn) {
    var principalId = "unknown"
    if(identity && identity.sub){
        principalId = identity.sub
    }

    //context can contain only key value pairs
    var context = {};
    if(identity && identity.uid){
        context.uid = identity.uid
    }

    var response = {
        "principalId": principalId,
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": effect,
                    "Resource": methodArn
                }
            ]
        }
    }
    if(Object.keys(context).length >0){
        response.context = context    
    }
    
    return response
}