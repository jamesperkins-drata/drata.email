const winston = require("winston");

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
});

const acceptPayload = {
    "commands":[
       {
          "type":"com.okta.action.update",
          "value":{
             "registration":"ALLOW"
          }
       }
    ]
 }

const denyPayload = {
    "error":{
       "errorSummary":"Errors were found in the user profile",
       "errorCauses":[
          {
             "errorSummary":"Please provide an Okta or Auth0 email address.",
             "reason":"INVALID_EMAIL_DOMAIN",
             "locationType":"body",
             "location":"data.userProfile.login",
             "domain":"end-user"
          }
       ]
    }
 }

module.exports.handler = async (event) => {
   var payload = JSON.parse(event.body)
   if(payload.data.userProfile.email.endsWith('@okta.com') || payload.data.userProfile.email.endsWith('@auth0.com')){
      console.info("Granted SSR.",{address: payload.data.userProfile.email})
      return {
         statusCode: 200,
         body: JSON.stringify(acceptPayload)
      }
   }
   else{
      console.info("Denied registration from external address",{address: payload.data.userProfile.email})
      return {
         statusCode: 200,
         body: JSON.stringify(denyPayload)
      }
   }
}