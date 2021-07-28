const middy = require('@middy/core')
const cors = require('@middy/http-cors')
const AWS = require('aws-sdk');

var s3 = new AWS.S3();
var bucketName = process.env.BUCKET;

const baseHandler = async (event) => {
    try {                
        var deleteParams = {
            Bucket: bucketName,
            Key: event.pathParameters.email+"/"+event.pathParameters.id
        }
        await s3.deleteObject(deleteParams).promise()
        return {
            statusCode: 200,
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