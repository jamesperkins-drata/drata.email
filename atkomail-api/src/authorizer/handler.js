"use strict";
const OktaJwtVerifier = require('@okta/jwt-verifier')

const baseVerifier = new OktaJwtVerifier({
    issuer: process.env.ISSUER,
});

exports.auth = (event, context) => {
    baseVerifier.verifyAccessToken(parseTokenFromEvent(event), process.env.AUDIENCE)
    .then((jwt) => {
        context.succeed(
            generateAuthResponse(jwt.claims.sub, 'Allow',  event.methodArn))
    })
    .catch(() => {
        console.log("token failed validation")
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