const winston = require("winston");
var Mixpanel = require('mixpanel');
const okta = require('@okta/okta-sdk-nodejs');
const AWS = require ('aws-sdk');


var mixpanel = Mixpanel.init(
    process.env.MIX_PANEL_TOKEN,
    {
      host: "api-eu.mixpanel.com",
    },
  );

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

const ssm = new AWS.SSM();
const oktaPrivateKeyPromise = ssm
  .getParameter({
    Name: process.env.EVENT_SERVICE_SECRET_NAME,
    WithDecryption: true
  })
  .promise()

module.exports.handler = async (event) => {
    var payload = JSON.parse(event.body)
    logger.debug('User profile event invoked.',{payload: payload, event:event})
    for (let index = 0; index < payload.data.events.length; index++) {
        try{
            const event = payload.data.events[index];
            logger.debug('Retrieving user from Okta', {userid: event.target[0].alternateId })
            var user = await findUserPromise(event.target[0].alternateId)
            var mixPanelUserProperties = {
                $name: event.target[0].displayName,
                $email: event.target[0].alternateId,
                organization: user.profile.organization,
                department: user.profile.department,
                location: user.profile.location
            }
            
            if(event.eventType === "user.lifecycle.create"){
                mixPanelUserProperties.created = user.created
            }

            logger.debug("Creating mixpanel user",{ userid:event.target[0].alternateId, properties: mixPanelUserProperties })
            await createUserPromise(event.target[0].alternateId, mixPanelUserProperties)
            logger.debug("Stored mixpanel user successfully",{ userid:event.target[0].alternateId })
        } catch(err){
            logger.err("Unable to record user event",{event:event,error:err})
        }
    }
    
    return {
        statusCode: 204
    }
}

const findUserPromise = (...args) => {
    return new Promise (async (resolve, reject) => {
        const privateKey = await oktaPrivateKeyPromise;
        const client = new okta.Client({
            orgUrl: 'https://account.atko.email',
            authorizationMode: 'PrivateKey',
            clientId: process.env.CLIENT_ID,
            scopes: ['okta.users.read'],
            privateKey: privateKey.Parameter.Value
        });

        client.getUser(...args)
        .then(user => {
            logger.debug("got okta user",{"user": user})
            resolve(user)
        })
        .catch(err => {
            logger.error("Unable to get user from Okta.",{'error':err})
            reject(err)
        })
    })
}

const createUserPromise = (...args) => {
    return new Promise ((resolve, reject) => {
        mixpanel.people.set(
            ...args,
            (err)=>{
                if(err){
                    reject(err)
                }
                else{
                    resolve()
                }
            }
        )
    }
)}