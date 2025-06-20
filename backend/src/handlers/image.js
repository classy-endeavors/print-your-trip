import { S3Service } from '../services/s3.service.js';
import { PDFConversionService } from '../services/pdf-conversion.service.js';
import { FileUtils } from '../utils/file.utils.js';

/**
 * Upload handler - Accepts cropped image from frontend and uploads to S3
 */
export const upload = async (event) => {
    console.log('=== IMAGE UPLOAD HANDLER START ===');
    console.log('Event:', JSON.stringify(event, null, 2));

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

    try {
        const body = event.body;
        const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';

        console.log('Content-Type:', contentType);
        console.log('Body length:', body?.length || 0);

        if (!body) {
            console.log('No body provided');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    message: 'No image data provided',
                    error: 'NO_BODY',
                }),
            };
        }

        let imageBuffer;
        let fileName = '';

        // Handle different content types
        if (contentType.includes('multipart/form-data')) {
            // Parse multipart form data
            const boundary = contentType.split('boundary=')[1];
            console.log('Boundary:', boundary);
            
            const parts = FileUtils.parseMultipartFormData(body, boundary);
            console.log('Parsed parts:', parts.map(p => ({ name: p.name, filename: p.filename, dataLength: p.data.length })));

            const imagePart = parts.find(part => part.name === 'image');
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

            imageBuffer = Buffer.from(imagePart.data, 'binary');
            fileName = imagePart.filename || 'image.jpg';
        } else if (contentType.includes('application/json')) {
            // Handle JSON with base64 image
            const bodyData = JSON.parse(body);
            if (!bodyData.imageData) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        message: 'No imageData found in JSON body',
                        error: 'NO_IMAGE_DATA',
                    }),
                };
            }

            // Remove data URL prefix if present
            const base64Data = bodyData.imageData.replace(/^data:image\/[a-z]+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
            fileName = bodyData.fileName || 'image.jpg';
        } else {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    message: 'Unsupported content type. Use multipart/form-data or application/json',
                    error: 'UNSUPPORTED_CONTENT_TYPE',
                }),
            };
        }

        console.log('Image buffer size:', imageBuffer.length);
        console.log('File name:', fileName);

        // Get bucket name from environment
        const bucket = process.env.IMAGE_S3_BUCKET;
        if (!bucket) {
            console.error('IMAGE_S3_BUCKET environment variable not set');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    message: 'S3 bucket configuration missing',
                    error: 'BUCKET_CONFIG_MISSING',
                }),
            };
        }

        // Generate sequential filename (0001, 0002, etc.)
        console.log('Getting next file number...');
        const nextNumber = await FileUtils.getNextFileNumber(bucket);
        console.log('Next file number:', nextNumber);

        const folderName = nextNumber.toString().padStart(4, '0');
        const s3Key = `${folderName}/${folderName}-rgb.jpg`;
        console.log('Generated S3 key:', s3Key);

        // Upload to S3
        console.log('Uploading to S3...');
        await S3Service.putObject(bucket, s3Key, imageBuffer, 'image/jpeg');
        console.log('S3 upload successful');

        // Generate public URL
        const downloadUrl = FileUtils.generateS3Url(bucket, s3Key);
        console.log('Generated download URL:', downloadUrl);

        const response = {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Image uploaded successfully',
                s3Path: s3Key,
                bucket,
                downloadUrl,
                folderNumber: nextNumber,
            }),
        };

        console.log('=== IMAGE UPLOAD HANDLER SUCCESS ===');
        return response;

    } catch (error) {
        console.error('=== IMAGE UPLOAD HANDLER ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: 'Error uploading image',
                error: error.message || 'Unknown error occurred',
            }),
        };
    }
};

/**
 * Convert handler - Converts RGB image to CMYK PDF
 */
export const convert = async (event) => {
    console.log('=== PDF CONVERSION HANDLER START ===');
    console.log('Event:', JSON.stringify(event, null, 2));

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

    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const s3Path = body.s3Path;

        console.log('S3 Path:', s3Path);

        if (!s3Path) {
            console.log('No S3 path provided');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    message: 'S3 path is required',
                    error: 'NO_S3_PATH',
                }),
            };
        }

        // Get bucket name from environment
        const bucket = process.env.IMAGE_S3_BUCKET;
        if (!bucket) {
            console.error('IMAGE_S3_BUCKET environment variable not set');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    message: 'S3 bucket configuration missing',
                    error: 'BUCKET_CONFIG_MISSING',
                }),
            };
        }

        // Download the image from S3
        console.log('Downloading image from S3...');
        const imageBuffer = await S3Service.getObject(bucket, s3Path);
        console.log('Image downloaded, size:', imageBuffer.length);

        // Convert to CMYK PDF
        console.log('Converting to CMYK PDF...');
        const pdfBuffer = await PDFConversionService.convertToCMYK(imageBuffer);
        console.log('PDF conversion complete, size:', pdfBuffer.length);

        // Generate CMYK PDF filename
        const pdfS3Key = s3Path.replace('-rgb.jpg', '-cmyk.pdf');
        console.log('PDF S3 key:', pdfS3Key);

        // Upload PDF to S3
        console.log('Uploading PDF to S3...');
        await S3Service.putObject(bucket, pdfS3Key, pdfBuffer, 'application/pdf');
        console.log('PDF upload successful');

        // Generate public URL for the PDF
        const pdfDownloadUrl = FileUtils.generateS3Url(bucket, pdfS3Key);
        console.log('Generated PDF download URL:', pdfDownloadUrl);

        const response = {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'PDF conversion completed successfully',
                pdfPath: pdfS3Key,
                pdfDownloadUrl,
                originalPath: s3Path,
                bucket,
            }),
        };

        console.log('=== PDF CONVERSION HANDLER SUCCESS ===');
        return response;

    } catch (error) {
        console.error('=== PDF CONVERSION HANDLER ERROR ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: 'Error converting to PDF',
                error: error.message || 'Unknown error occurred',
            }),
        };
    }
};