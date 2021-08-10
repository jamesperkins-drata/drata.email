const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const simpleParser = require('mailparser').simpleParser;
const AWS = require('aws-sdk');
var md5 = require("md5"); 
var s3 = new AWS.S3();

var bucketName = process.env.BUCKET;

const baseHandler = async (event) => {
    var listParams = {
        Bucket: bucketName, 
        Delimiter: '/',
        MaxKeys: 100,
        Prefix: event.pathParameters.email+"/"
       };

    try {
        var result = await s3.listObjectsV2(listParams).promise()
        if(result.Contents.length == 0){
            return {
                statusCode: 200,
                body: JSON.stringify({
                    messages: []
                })
            }
        }
        else{
            var messages = []
            for (let index = 0; index < result.Contents.length; index++) {
                const element = result.Contents[index];
                
                var getParams = {
                    Bucket: bucketName,
                    Key: element.Key
                }
                var obj = await s3.getObject(getParams).promise()
                let parsed = await simpleParser(obj.Body)
                var mail = {
                    id: element.Key,
                    from: parsed.from,
                    avatar: 'https://www.gravatar.com/avatar/'+md5(parsed.from.value[0].address)+'?d=mp',
                    date: parsed.date,
                    subject: parsed.subject,
                    attachmentCount: parsed.attachments.length
                }
                messages.push(mail)
            }
            return {
                statusCode: 200,
                body: JSON.stringify({
                    //reverse to place messages in latest first order
                    //assumes mail id increments within a given mailbox
                    messages: messages.reverse()
                })
            }
        }
    }
    catch(error){
        console.log(error)
        return{
            status: 500,
            error: "Something failed, sorry."
        }
    }

}

const handler = middy(baseHandler)
.use(cors({
    credentials: true,
    origins: process.env.ORIGINS.split(' ')
}))

module.exports = {handler}