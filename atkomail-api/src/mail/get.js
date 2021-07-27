var AWS = require('aws-sdk');
var s3 = new AWS.S3();
const simpleParser = require('mailparser').simpleParser;

var bucketName = process.env.BUCKET;

module.exports.handler = async (event) => {

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