const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const AWS = require('aws-sdk');
const simpleParser = require('mailparser').simpleParser;

var s3 = new AWS.S3();
var bucketName = process.env.BUCKET;

const baseHandler = async (event) => {

    try {                
        var getParams = {
            Bucket: bucketName,
            Key: event.pathParameters.email+"/"+event.pathParameters.id
        }
        var obj = await s3.getObject(getParams).promise()
        let parsed = await simpleParser(obj.Body)
        return {
            statusCode: 200,
            body: JSON.stringify(parsed)
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