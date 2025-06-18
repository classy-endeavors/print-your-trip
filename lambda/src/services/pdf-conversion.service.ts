import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import { Readable } from 'stream';

export class PDFConversionService {
    static async convertToCMYK(imageBuffer: Buffer): Promise<Buffer> {
        // Convert image to CMYK using sharp
        const cmykImage = await sharp(imageBuffer).toColorspace('cmyk').toBuffer();

        // Get image dimensions
        const metadata = await sharp(cmykImage).metadata();
        const width = metadata.width || 0;
        const height = metadata.height || 0;

        // Create a new PDF document
        const doc = new PDFDocument({
            size: [width, height],
            autoFirstPage: false,
        });

        // Create a buffer to store the PDF
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));

        // Create a promise to wait for the PDF to be generated
        const pdfPromise = new Promise<Buffer>((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });

        // Add a new page
        doc.addPage({
            size: [width, height],
        });

        // Embed the CMYK image
        doc.image(cmykImage, 0, 0, {
            width: width,
            height: height,
        });

        // Finalize the PDF
        doc.end();

        // Wait for the PDF to be generated and return it
        return pdfPromise;
    }
}
