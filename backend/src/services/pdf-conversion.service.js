import PDFDocument from 'pdfkit';
import sharp from 'sharp';

export class PDFConversionService {
    static async convertToCMYK(imageBuffer) {
        console.log('=== PDF CONVERSION START ===');
        console.log(`Input image buffer size: ${imageBuffer.length}`);

        try {
            // First, ensure the image is cropped to 1800x1200 (4x6 inches at 300 DPI)
            console.log('Resizing and cropping image to 1800x1200...');
            const resizedImage = await sharp(imageBuffer)
                .resize(1800, 1200, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 100 })
                .toBuffer();

            console.log('Converting to CMYK color space...');
            // Convert image to CMYK using sharp
            const cmykImage = await sharp(resizedImage)
                .toColorspace('cmyk')
                .jpeg({ quality: 100 })
                .toBuffer();

            console.log(`CMYK image buffer size: ${cmykImage.length}`);

            // Get image dimensions (should be 1800x1200)
            const metadata = await sharp(cmykImage).metadata();
            const width = metadata.width || 1800;
            const height = metadata.height || 1200;
            console.log(`Image dimensions: ${width}x${height}`);

            // Create a new PDF document with exact dimensions for 4x6 inches at 300 DPI
            console.log('Creating PDF document...');
            const doc = new PDFDocument({
                size: [width, height],
                autoFirstPage: false,
                margins: { top: 0, bottom: 0, left: 0, right: 0 }
            });

            // Create a buffer to store the PDF
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));

            // Create a promise to wait for the PDF to be generated
            const pdfPromise = new Promise((resolve) => {
                doc.on('end', () => {
                    const result = Buffer.concat(chunks);
                    console.log(`Generated PDF buffer size: ${result.length}`);
                    resolve(result);
                });
            });

            // Add a new page with exact dimensions
            doc.addPage({
                size: [width, height],
                margins: { top: 0, bottom: 0, left: 0, right: 0 }
            });

            // Embed the CMYK image at exact size
            console.log('Embedding CMYK image in PDF...');
            doc.image(cmykImage, 0, 0, {
                width: width,
                height: height,
            });

            // Finalize the PDF
            console.log('Finalizing PDF...');
            doc.end();

            // Wait for the PDF to be generated and return it
            const result = await pdfPromise;
            console.log('=== PDF CONVERSION SUCCESS ===');
            return result;
        } catch (error) {
            console.error('=== PDF CONVERSION ERROR ===');
            console.error('Error details:', error);
            throw error;
        }
    }
} 