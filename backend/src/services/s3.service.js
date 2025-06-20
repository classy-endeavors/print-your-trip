import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

export class S3Service {
    static s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        // Use default credentials from AWS SDK (IAM role, env vars, etc.)
    });

    static async getObject(bucket, key) {
        console.log(`=== S3 GET OBJECT ===`);
        console.log(`Bucket: ${bucket}`);
        console.log(`Key: ${key}`);

        try {
            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            });

            console.log('Sending GetObjectCommand...');
            const response = await this.s3Client.send(command);
            console.log('GetObjectCommand successful');

            const chunks = [];

            if (response.Body) {
                console.log('Reading response body...');
                for await (const chunk of response.Body) {
                    chunks.push(chunk);
                }
                console.log(`Read ${chunks.length} chunks`);
            }

            const result = Buffer.concat(chunks);
            console.log(`Final buffer size: ${result.length}`);
            console.log('=== S3 GET OBJECT SUCCESS ===');
            return result;
        } catch (error) {
            console.error('=== S3 GET OBJECT ERROR ===');
            console.error('Error details:', error);
            throw error;
        }
    }

    static async putObject(bucket, key, body, contentType = 'application/octet-stream') {
        console.log(`=== S3 PUT OBJECT ===`);
        console.log(`Bucket: ${bucket}`);
        console.log(`Key: ${key}`);
        console.log(`Body size: ${body.length}`);
        console.log(`Content-Type: ${contentType}`);

        try {
            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
            });

            console.log('Sending PutObjectCommand...');
            await this.s3Client.send(command);
            console.log('PutObjectCommand successful');
            console.log('=== S3 PUT OBJECT SUCCESS ===');
        } catch (error) {
            console.error('=== S3 PUT OBJECT ERROR ===');
            console.error('Error details:', error);
            throw error;
        }
    }

    static async listObjects(bucket, prefix) {
        console.log(`=== S3 LIST OBJECTS ===`);
        console.log(`Bucket: ${bucket}`);
        console.log(`Prefix: ${prefix || 'none'}`);

        try {
            const command = new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefix,
            });

            console.log('Sending ListObjectsV2Command...');
            const response = await this.s3Client.send(command);
            console.log('ListObjectsV2Command successful');
            console.log(`Found ${response.Contents?.length || 0} objects`);

            const result = response.Contents || [];
            console.log('=== S3 LIST OBJECTS SUCCESS ===');
            return result;
        } catch (error) {
            console.error('=== S3 LIST OBJECTS ERROR ===');
            console.error('Error details:', error);
            throw error;
        }
    }
} 