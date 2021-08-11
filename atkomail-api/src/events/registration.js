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
             "errorSummary":"Please provide an okta email address.",
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
        return {
            statusCode: 200,
            body: JSON.stringify(acceptPayload)
        }
    }
    else{
        return {
            statusCode: 200,
            body: JSON.stringify(denyPayload)
        }
    }
}