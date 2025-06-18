import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
  forcePathStyle: true,
});

async function testS3Connection() {
  try {
    console.log('Testing S3 connection...');
    
    // List buckets
    const listCommand = new ListBucketsCommand({});
    const result = await s3Client.send(listCommand);
    console.log('✅ S3 connection successful!');
    console.log('Available buckets:', result.Buckets?.map(b => b.Name));
    
    // Test upload
    const uploadCommand = new PutObjectCommand({
      Bucket: 'print-your-trip-source-us-east-1',
      Key: 'test-file.txt',
      Body: 'Hello MinIO!',
      ContentType: 'text/plain',
    });
    
    await s3Client.send(uploadCommand);
    console.log('✅ Upload successful!');
    
  } catch (error) {
    console.error('❌ S3 connection failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode
    });
  }
}

testS3Connection(); 