import { S3Event } from 'aws-lambda';
import { S3Service } from './services/s3.service';
import { PDFConversionService } from './services/pdf-conversion.service';
import { FileUtils } from './utils/file.utils';

/**
 * Handles S3 events for image conversion from RGB to CMYK PDF
 * @param {S3Event} event - S3 Event containing information about the uploaded file
 * @returns {Object} API Gateway Lambda Proxy Output Format
 */
export const lambdaHandler = async (event: S3Event): Promise<{ statusCode: number; body: string }> => {
    try {
        // Validate event
        if (!event?.Records?.[0]?.s3) {
            throw new Error('Invalid event structure');
        }

        // Extract S3 information
        const bucket = event.Records[0].s3.bucket.name;
        const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

        // Validate file type
        if (!FileUtils.isValidRGBFile(key)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'Only RGB images are supported for conversion',
                    error: 'INVALID_FILE_TYPE'
                })
            };
        }

        // Prepare output path
        const folderPath = FileUtils.getFolderPath(key);
        const outputKey = `${folderPath}${FileUtils.getCMYKFilename(FileUtils.getBaseFilename(key))}`;

        // Process the image
        const imageBuffer = await S3Service.getObject(bucket, key);
        const cmykPdfBuffer = await PDFConversionService.convertToCMYK(imageBuffer);
        await S3Service.putObject(bucket, outputKey, cmykPdfBuffer);

        // Generate public URL
        const publicUrl = `https://${bucket}.s3.amazonaws.com/${outputKey}`;

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully converted RGB image to CMYK PDF',
                downloadUrl: publicUrl,
                inputKey: key,
                outputKey
            })
        };

    } catch (error: unknown) {
        console.error('Error processing image:', error);
        const errorObj = error as { statusCode?: number; message?: string; code?: string };
        return {
            statusCode: errorObj.statusCode || 500,
            body: JSON.stringify({
                message: 'Error processing the image',
                error: errorObj.message || 'Unknown error occurred',
                errorCode: errorObj.code || 'UNKNOWN_ERROR'
            })
        };
    }
};
