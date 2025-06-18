import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

export class S3Service {
    private static s3Client = new S3Client({});

    static async getObject(bucket: string, key: string): Promise<Buffer> {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        const response = await this.s3Client.send(command);
        const chunks: Uint8Array[] = [];

        if (response.Body) {
            for await (const chunk of response.Body as any) {
                chunks.push(chunk);
            }
        }

        return Buffer.concat(chunks);
    }

    static async putObject(bucket: string, key: string, body: Buffer): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: 'application/pdf',
        });

        await this.s3Client.send(command);
    }
}
