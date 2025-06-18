import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Service } from './services/s3.service';
import { PDFConversionService } from './services/pdf-conversion.service';
import { FileUtils } from './utils/file.utils';

/**
 * Handles API Gateway events for image upload and PDF conversion
 * @param {APIGatewayProxyEvent} event - API Gateway Proxy Event
 * @returns {APIGatewayProxyResult} API Gateway Proxy Result Format
 */
export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('=== LAMBDA HANDLER START ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Environment variables:', {
        SOURCE_BUCKET: process.env.SOURCE_BUCKET,
        S3_ENDPOINT: process.env.S3_ENDPOINT,
        AWS_REGION: process.env.AWS_REGION,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT_SET',
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT_SET',
    });

    try {
        // Set CORS headers
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        };

        // Handle preflight requests
        if (event.httpMethod === 'OPTIONS') {
            console.log('Handling OPTIONS preflight request');
            return {
                statusCode: 200,
                headers,
                body: '',
            };
        }

        const path = event.path;
        const method = event.httpMethod;
        console.log(`Processing ${method} request to ${path}`);

        // Route based on path and method
        if (path === '/upload' && method === 'POST') {
            console.log('Routing to image upload handler');
            return await handleImageUpload(event, headers);
        } else if (path === '/convert' && method === 'POST') {
            console.log('Routing to PDF conversion handler');
            return await handlePDFConversion(event, headers);
        } else {
            console.log(`No handler found for ${method} ${path}`);
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    message: 'Endpoint not found',
                    error: 'NOT_FOUND',
                }),
            };
        }
    } catch (error: any) {
        console.error('=== LAMBDA HANDLER ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message || 'Unknown error occurred',
            }),
        };
    }
};

/**
 * Handles image upload to S3
 */
async function handleImageUpload(event: APIGatewayProxyEvent, headers: any): Promise<APIGatewayProxyResult> {
    console.log('=== IMAGE UPLOAD HANDLER START ===');
    try {
        // Parse multipart form data
        const body = event.body;
        const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';

        console.log('Content-Type:', contentType);
        console.log('Body length:', body?.length || 0);

        if (!body || !contentType.includes('multipart/form-data')) {
            console.log('Invalid request format - missing body or wrong content type');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    message: 'Invalid request format. Expected multipart/form-data',
                    error: 'INVALID_FORMAT',
                }),
            };
        }

        // Parse the multipart form data
        const boundary = contentType.split('boundary=')[1];
        console.log('Boundary:', boundary);
        const parts = parseMultipartFormData(body, boundary);
        console.log(
            'Parsed parts:',
            parts.map((p) => ({ name: p.name, filename: p.filename, dataLength: p.data.length })),
        );

        const imagePart = parts.find((part) => part.name === 'image');
        if (!imagePart) {
            console.log('No image part found in multipart data');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    message: 'No image file found in request',
                    error: 'NO_IMAGE',
                }),
            };
        }

        console.log('Image part found:', { filename: imagePart.filename, dataLength: imagePart.data.length });

        // Generate sequential filename (0001, 0002, etc.)
        console.log('Getting next file number...');
        const nextNumber = await getNextFileNumber();
        console.log('Next file number:', nextNumber);

        const folderName = nextNumber.toString().padStart(4, '0');
        const filename = `${folderName}/${folderName}-rgb.jpg`;
        console.log('Generated filename:', filename);

        // Upload to S3
        const bucket = process.env.SOURCE_BUCKET || 'print-your-trip-source-us-east-1';
        console.log('Using bucket:', bucket);
        console.log('S3 endpoint:', process.env.S3_ENDPOINT || 'default');

        const imageBuffer = Buffer.from(imagePart.data, 'base64');
        console.log('Image buffer size:', imageBuffer.length);

        console.log('Attempting to upload to S3...');
        await S3Service.putObject(bucket, filename, imageBuffer, 'image/jpeg');
        console.log('S3 upload successful');

        // Generate URL based on environment
        const s3Endpoint = process.env.S3_ENDPOINT || 'https://s3.amazonaws.com';
        const downloadUrl =
            s3Endpoint === 'http://localhost:9000'
                ? `http://localhost:9000/${bucket}/${filename}`
                : `https://${bucket}.s3.amazonaws.com/${filename}`;

        console.log('Generated download URL:', downloadUrl);

        const response = {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Image uploaded successfully',
                s3Path: filename,
                bucket,
                downloadUrl,
            }),
        };

        console.log('=== IMAGE UPLOAD HANDLER SUCCESS ===');
        console.log('Response:', JSON.stringify(response, null, 2));
        return response;
    } catch (error: any) {
        console.error('=== IMAGE UPLOAD HANDLER ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: 'Error uploading image',
                error: error.message || 'Unknown error occurred',
                errorCode: error.code || 'UNKNOWN',
            }),
        };
    }
}

/**
 * Handles PDF conversion from S3 image
 */
async function handlePDFConversion(event: APIGatewayProxyEvent, headers: any): Promise<APIGatewayProxyResult> {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const s3Path = body.s3Path as string;

        if (!s3Path) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    message: 'Please provide an S3 path to an image',
                    error: 'INVALID_INPUT',
                }),
            };
        }

        const bucket = process.env.SOURCE_BUCKET || 'print-your-trip-source-us-east-1';

        // Prepare output path using the folder structure
        const folderPath = s3Path.substring(0, s3Path.lastIndexOf('/') + 1);
        const baseName = s3Path.substring(s3Path.lastIndexOf('/') + 1).replace('-rgb.jpg', '');
        const outputKey = `${folderPath}${baseName}-cmyk.pdf`;

        // Process the image
        const imageBuffer = await S3Service.getObject(bucket, s3Path);
        const cmykPdfBuffer = await PDFConversionService.convertToCMYK(imageBuffer);
        await S3Service.putObject(bucket, outputKey, cmykPdfBuffer, 'application/pdf');

        // Generate public URL
        const s3Endpoint = process.env.S3_ENDPOINT || 'https://s3.amazonaws.com';
        const publicUrl =
            s3Endpoint === 'http://localhost:9000'
                ? `http://localhost:9000/${bucket}/${outputKey}`
                : `https://${bucket}.s3.amazonaws.com/${outputKey}`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Successfully converted image to CMYK PDF',
                downloadUrl: publicUrl,
                inputKey: s3Path,
                outputKey,
            }),
        };
    } catch (error: any) {
        console.error('Conversion error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: 'Error converting image to PDF',
                error: error.message || 'Unknown error occurred',
            }),
        };
    }
}

/**
 * Parse multipart form data
 */
function parseMultipartFormData(
    body: string,
    boundary: string,
): Array<{ name: string; filename?: string; data: string }> {
    const parts: Array<{ name: string; filename?: string; data: string }> = [];
    const boundaryStr = `--${boundary}`;
    const sections = body.split(boundaryStr);

    for (const section of sections) {
        if (section.trim() === '' || section.includes('--')) continue;

        const lines = section.split('\r\n');
        const headers: { [key: string]: string } = {};
        let data = '';
        let inData = false;

        for (const line of lines) {
            if (line.trim() === '') {
                inData = true;
                continue;
            }

            if (inData) {
                data += line + '\r\n';
            } else {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).toLowerCase();
                    const value = line.substring(colonIndex + 1).trim();
                    headers[key] = value;
                }
            }
        }

        const contentDisposition = headers['content-disposition'] || '';
        const nameMatch = contentDisposition.match(/name="([^"]+)"/);
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);

        if (nameMatch) {
            parts.push({
                name: nameMatch[1],
                filename: filenameMatch ? filenameMatch[1] : undefined,
                data: data.trim(),
            });
        }
    }

    return parts;
}

/**
 * Get the next sequential file number by checking existing files in S3
 */
async function getNextFileNumber(): Promise<number> {
    console.log('=== GET NEXT FILE NUMBER START ===');
    try {
        const bucket = process.env.SOURCE_BUCKET || 'print-your-trip-source-us-east-1';
        console.log('Listing objects in bucket:', bucket);
        console.log('S3 endpoint for listing:', process.env.S3_ENDPOINT || 'default');

        // List objects in the bucket to find the highest number
        const objects = await S3Service.listObjects(bucket);
        console.log('Listed objects count:', objects.length);
        console.log('Object keys:', objects.map((obj) => obj.Key).slice(0, 10)); // Show first 10

        let maxNumber = 0;

        for (const object of objects) {
            const match = object.Key?.match(/^(\d{4})\//);
            if (match) {
                const number = parseInt(match[1], 10);
                console.log(`Found numbered folder: ${object.Key} -> number: ${number}`);
                if (number > maxNumber) {
                    maxNumber = number;
                }
            }
        }

        const nextNumber = maxNumber + 1;
        console.log(`Max number found: ${maxNumber}, next number: ${nextNumber}`);
        console.log('=== GET NEXT FILE NUMBER SUCCESS ===');
        return nextNumber;
    } catch (error: any) {
        console.error('=== GET NEXT FILE NUMBER ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Fallback to timestamp-based numbering if listing fails
        const fallbackNumber = Math.floor(Date.now() / 1000);
        console.log(`Using fallback number: ${fallbackNumber}`);
        return fallbackNumber;
    }
}
