const winston = require("winston");
var Mixpanel = require('mixpanel');

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

module.exports.handler = async (event) => {
   var payload = JSON.parse(event.body)
   for (let index = 0; index < payload.data.events.length; index++) {
       const event = payload.data.events[index];
       logger.debug("Parsing event",{event: event})
       var mixPanelUserProperties = {
            $name: event.target[0].displayName,
            $email: event.target[0].alternateId,
            created: (new Date()).toISOString()
        }
        logger.info("Creating mixpanel user",{properties: mixPanelUserProperties})
        createUserPromise(event.target[0].alternateId, mixPanelUserProperties)
        .then(()=>{
            console.log("User created in mixpanel")
            return {
                statusCode: 204
            }
        })
        .catch(err => {
            console.log("Unable to create user.")
            return {
                statusCode: 204
            }
        })
   }
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