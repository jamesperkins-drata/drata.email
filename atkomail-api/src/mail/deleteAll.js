const middy = require('@middy/core')
const cors = require('@middy/http-cors')
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
                statusCode: 200
            }
        }
        else{
            //all nested objects must be removed first
            for (let index = 0; index < result.Contents.length; index++) {
                const element = result.Contents[index];
                var deleteParams = {
                    Bucket: bucketName,
                    Key: element.Key
                }
                await s3.deleteObject(deleteParams).promise()
            }
            var deleteParams = {
                Bucket: bucketName,
                Key: event.pathParameters.email
            }
            await s3.deleteObject(deleteParams).promise()
            return {
                statusCode: 200
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