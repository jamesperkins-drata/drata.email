var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var bucketName = process.env.BUCKET;

module.exports.handler = async (event) => {

    try {                
        var deleteParams = {
            Bucket: bucketName,
            Key: event.pathParameters.email+"/"+event.pathParameters.id
        }
        await s3.deleteObject(deleteParams).promise()
        return {
            statusCode: 200
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