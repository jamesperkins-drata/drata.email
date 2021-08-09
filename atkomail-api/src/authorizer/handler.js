"use strict";
const OktaJwtVerifier = require('@okta/jwt-verifier')

const baseVerifier = new OktaJwtVerifier({
    issuer: process.env.ISSUER,
});

exports.auth = async (event, context) => {
    await baseVerifier.verifyAccessToken(parseTokenFromEvent(event), process.env.AUDIENCE)
    .then((jwt) => {
        console.log(event.methodArn)
        const domains = jwt.claims.maildomains
        if(domains && domains.length > 0){
            const gatewayPath = event.methodArn.split(':')[5]
            var mailbox = gatewayPath.split('/')[4]
            var mailDomain = mailbox.split('@')[1]
            if(domains.includes("mailbox:"+mailDomain)){
                context.succeed(
                generateAuthResponse(jwt.claims.sub, 'Allow',  event.methodArn))
            } else{
                console.error("No matching mail domain found.")
                context.fail('Unauthorized')
            }
        }
        else {
            console.error("No mail domains available.")
            context.fail('Unauthorized')
        }
    })
    .catch((err) => {
        console.error("token failed validation")
        console.error(error)
        context.fail('Unauthorized')
    });
};


exports.fixed = (event, context) => {
    if(event.authorizationToken == process.env.FIXED_AUTH_SECRET) {
        context.succeed(
            generateAuthResponse("fixedToken", 'Allow',  event.methodArn))
    }
    else{
        context.fail('Unauthorized')
    }
}

function parseTokenFromEvent(event){
    return event.authorizationToken.split(' ')[1]
}

function generateAuthResponse(principalId, effect, methodArn) {
    return {
        'principalId': principalId,
        'policyDocument': {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: methodArn
            }]
        }
    }
}