const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const simpleParser = require('mailparser').simpleParser;
const AWS = require('aws-sdk');
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
                    date: parsed.date,
                    subject: parsed.subject,
                    attachmentCount: parsed.attachments.length
                }
                messages.push(mail)
            }
            return {
                statusCode: 200,
                body: JSON.stringify({
                    messages: messages
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
    origins: process.env.ORIGINS
}))

module.exports = {handler}