import { S3Service } from '../services/s3.service.js';

export class FileUtils {
    /**
     * Get the next sequential file number by checking existing files in S3
     */
    static async getNextFileNumber(bucket) {
        console.log('=== GET NEXT FILE NUMBER ===');
        console.log(`Bucket: ${bucket}`);

        try {
            // List all objects in the bucket
            const objects = await S3Service.listObjects(bucket);
            console.log(`Found ${objects.length} objects in bucket`);

            // Extract folder numbers from existing files
            const folderNumbers = objects
                .map(obj => {
                    const key = obj.Key || '';
                    // Extract folder number from patterns like "0001/0001-rgb.jpg"
                    const match = key.match(/^(\d{4})\//);
                    return match ? parseInt(match[1], 10) : 0;
                })
                .filter(num => num > 0);

            console.log('Existing folder numbers:', folderNumbers);

            // Get the next number
            const nextNumber = folderNumbers.length > 0 ? Math.max(...folderNumbers) + 1 : 1;
            console.log(`Next file number: ${nextNumber}`);
            
            console.log('=== GET NEXT FILE NUMBER SUCCESS ===');
            return nextNumber;
        } catch (error) {
            console.error('=== GET NEXT FILE NUMBER ERROR ===');
            console.error('Error details:', error);
            // If there's an error listing objects, start from 1
            return 1;
        }
    }

    /**
     * Parse multipart form data from Lambda event
     */
    static parseMultipartFormData(body, boundary) {
        console.log('=== PARSE MULTIPART FORM DATA ===');
        console.log(`Body length: ${body.length}`);
        console.log(`Boundary: ${boundary}`);

        const parts = [];
        const boundaryBuffer = Buffer.from(`--${boundary}`);
        const bodyBuffer = Buffer.from(body, 'base64');

        // Split by boundary
        const sections = bodyBuffer.toString('binary').split(`--${boundary}`);
        console.log(`Found ${sections.length} sections`);

        for (let i = 1; i < sections.length - 1; i++) {
            const section = sections[i];
            const headerEnd = section.indexOf('\r\n\r\n');
            
            if (headerEnd === -1) continue;

            const headers = section.substring(0, headerEnd);
            const content = section.substring(headerEnd + 4);

            // Parse Content-Disposition header
            const dispositionMatch = headers.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/);
            if (!dispositionMatch) continue;

            const name = dispositionMatch[1];
            const filename = dispositionMatch[2];

            // Remove trailing boundary markers
            const cleanContent = content.replace(/\r\n$/, '');

            parts.push({
                name,
                filename,
                data: cleanContent
            });

            console.log(`Parsed part: ${name}, filename: ${filename}, data length: ${cleanContent.length}`);
        }

        console.log('=== PARSE MULTIPART FORM DATA SUCCESS ===');
        return parts;
    }

    /**
     * Generate public S3 URL
     */
    static generateS3Url(bucket, key, region = 'us-east-2') {
        return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    }
} 