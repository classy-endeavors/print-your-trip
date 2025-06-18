import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Service } from './services/s3.service';
import { PDFConversionService } from './services/pdf-conversion.service';
import { FileUtils } from './utils/file.utils';

/**
 * Handles S3 events for image conversion from RGB to CMYK PDF
 * @param {APIGatewayProxyEvent} event - API Gateway Proxy Event containing information about the uploaded file
 * @returns {APIGatewayProxyResult} API Gateway Proxy Result Format
 */
export const lambdaHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        // Parse input (assume JSON body with s3Path)
        const body = event.body ? JSON.parse(event.body) : {};
        const s3Path = body.s3Path as string;

        if (!s3Path || !FileUtils.isValidRGBFile(s3Path)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'Please provide a valid S3 path to an RGB image',
                    error: 'INVALID_INPUT',
                }),
            };
        }

        // Use the bucket from env or default to the one created by SAM
        const bucket = process.env.SOURCE_BUCKET || body.bucket || 'print-your-trip-source-us-east-1';
        const key = s3Path;

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
                outputKey,
            }),
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error processing the image',
                error: error.message || 'Unknown error occurred',
            }),
        };
    }
};
