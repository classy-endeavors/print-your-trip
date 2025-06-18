import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

export class S3Service {
    private static s3Client = new S3Client({
        endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
        },
        forcePathStyle: true, // Required for MinIO
    });

    static async getObject(bucket: string, key: string): Promise<Buffer> {
        console.log(`=== S3 GET OBJECT ===`);
        console.log(`Bucket: ${bucket}`);
        console.log(`Key: ${key}`);
        console.log(`S3 Client config:`, {
            endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
            region: process.env.AWS_REGION || 'us-east-1',
            forcePathStyle: true,
        });

        try {
            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            });

            console.log('Sending GetObjectCommand...');
            const response = await this.s3Client.send(command);
            console.log('GetObjectCommand successful');

            const chunks: Uint8Array[] = [];

            if (response.Body) {
                console.log('Reading response body...');
                for await (const chunk of response.Body as any) {
                    chunks.push(chunk);
                }
                console.log(`Read ${chunks.length} chunks`);
            }

            const result = Buffer.concat(chunks);
            console.log(`Final buffer size: ${result.length}`);
            console.log('=== S3 GET OBJECT SUCCESS ===');
            return result;
        } catch (error: any) {
            console.error('=== S3 GET OBJECT ERROR ===');
            console.error('Error details:', error);
            console.error('Error name:', error.name);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            throw error;
        }
    }

    static async putObject(bucket: string, key: string, body: Buffer, contentType?: string): Promise<void> {
        console.log(`=== S3 PUT OBJECT ===`);
        console.log(`Bucket: ${bucket}`);
        console.log(`Key: ${key}`);
        console.log(`Body size: ${body.length}`);
        console.log(`Content-Type: ${contentType || 'application/pdf'}`);
        console.log(`S3 Client config:`, {
            endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
            region: process.env.AWS_REGION || 'us-east-1',
            forcePathStyle: true,
        });

        try {
            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body,
                ContentType: contentType || 'application/pdf',
            });

            console.log('Sending PutObjectCommand...');
            await this.s3Client.send(command);
            console.log('PutObjectCommand successful');
            console.log('=== S3 PUT OBJECT SUCCESS ===');
        } catch (error: any) {
            console.error('=== S3 PUT OBJECT ERROR ===');
            console.error('Error details:', error);
            console.error('Error name:', error.name);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            throw error;
        }
    }

    static async listObjects(bucket: string, prefix?: string): Promise<Array<{ Key?: string }>> {
        console.log(`=== S3 LIST OBJECTS ===`);
        console.log(`Bucket: ${bucket}`);
        console.log(`Prefix: ${prefix || 'none'}`);
        console.log(`S3 Client config:`, {
            endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
            region: process.env.AWS_REGION || 'us-east-1',
            forcePathStyle: true,
        });

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
        } catch (error: any) {
            console.error('=== S3 LIST OBJECTS ERROR ===');
            console.error('Error details:', error);
            console.error('Error name:', error.name);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            throw error;
        }
    }
}
