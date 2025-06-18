import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

export class PDFConversionService {
    static async convertToCMYK(imageBuffer: Buffer): Promise<Buffer> {
        // Convert image to CMYK using sharp
        const cmykImage = await sharp(imageBuffer)
            .toColorspace('cmyk')
            .toBuffer();

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        
        // Get image dimensions
        const metadata = await sharp(cmykImage).metadata();
        const width = metadata.width || 0;
        const height = metadata.height || 0;

        // Add a new page with the image dimensions
        const page = pdfDoc.addPage([width, height]);

        // Embed the CMYK image
        const image = await pdfDoc.embedJpg(cmykImage);
        
        // Draw the image on the page
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: width,
            height: height,
        });

        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
} 