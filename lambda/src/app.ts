import { S3Event } from 'aws-lambda';
import { FileUtils } from './utils/fileUtils';
import { S3Service } from './services/s3Service';
import { PDFConversionService } from './services/pdfConversionService';

/**
 * Handles S3 events for PDF conversion from RGB to CMYK
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
        if (!key.endsWith('-rgb.pdf')) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'Only RGB PDFs are supported for conversion',
                    error: 'INVALID_FILE_TYPE'
                })
            };
        }

        // Prepare output path
        const folderPath = key.substring(0, key.lastIndexOf('/') + 1);
        const filename = key.substring(key.lastIndexOf('/') + 1);
        const baseFilename = FileUtils.getBaseFilename(filename);
        const outputKey = `${folderPath}${baseFilename.replace('-rgb', '-cmyk')}.pdf`;

        // Process the PDF
        const pdfBuffer = await S3Service.getObject(bucket, key);
        const cmykPdfBuffer = await PDFConversionService.convertToCMYK(pdfBuffer);
        await S3Service.putObject(bucket, outputKey, cmykPdfBuffer);

        // Generate public URL
        const publicUrl = `https://${bucket}.s3.amazonaws.com/${outputKey}`;

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully converted RGB PDF to CMYK',
                downloadUrl: publicUrl,
                inputKey: key,
                outputKey
            })
        };

    } catch (error: unknown) {
        console.error('Error processing PDF:', error);
        const errorObj = error as { statusCode?: number; message?: string; code?: string };
        return {
            statusCode: errorObj.statusCode || 500,
            body: JSON.stringify({
                message: 'Error processing the PDF',
                error: errorObj.message || 'Unknown error occurred',
                errorCode: errorObj.code || 'UNKNOWN_ERROR'
            })
        };
    }
};
