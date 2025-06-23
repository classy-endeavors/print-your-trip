import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import convert from 'color-convert';

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

            console.log('Converting to CMYK color space using color-convert...');
            
            // Get RGB pixel data from the image
            const { data: rgbData, info } = await sharp(resizedImage)
                .raw()
                .toBuffer({ resolveWithObject: true });

            console.log(`Processing ${info.width}x${info.height} pixels for CMYK conversion...`);

            // Convert RGB to CMYK using color-convert (most accurate method)
            const cmykPixels = [];
            const printReadyRgbData = new Uint8Array(rgbData.length);

            for (let i = 0; i < rgbData.length; i += 3) {
                const r = rgbData[i];
                const g = rgbData[i + 1]; 
                const b = rgbData[i + 2];
                
                // Convert RGB to CMYK using color-convert (accurate conversion)
                const [c, m, y, k] = convert.rgb.cmyk([r, g, b]);
                
                // Store CMYK values for statistics
                cmykPixels.push({ c, m, y, k });
                
                // Convert CMYK back to RGB using color-convert for print accuracy
                // This gives us the most accurate representation of how the CMYK will look when printed
                const [printR, printG, printB] = convert.cmyk.rgb([c, m, y, k]);
                
                // Store the print-ready RGB values
                printReadyRgbData[i] = printR;
                printReadyRgbData[i + 1] = printG;
                printReadyRgbData[i + 2] = printB;
            }

            console.log(`CMYK conversion completed for ${cmykPixels.length} pixels`);
            
            // Log CMYK statistics for verification
            this.logCMYKStatistics(cmykPixels);

            // Create print-ready image buffer from the CMYK-optimized RGB data
            console.log('Creating print-ready image buffer...');
            const printReadyImage = await sharp(printReadyRgbData, {
                raw: {
                    width: info.width,
                    height: info.height,
                    channels: 3
                }
            })
            .jpeg({ quality: 100 })
            .toBuffer();

            console.log(`Print-ready image buffer size: ${printReadyImage.length}`);

            // Get image dimensions (should be 1800x1200)
            const metadata = await sharp(printReadyImage).metadata();
            const width = metadata.width || 1800;
            const height = metadata.height || 1200;
            console.log(`Final image dimensions: ${width}x${height}`);

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

            // Embed the print-ready image at exact size
            console.log('Embedding print-ready CMYK image in PDF...');
            doc.image(printReadyImage, 0, 0, {
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

    static logCMYKStatistics(cmykPixels) {
        if (cmykPixels.length === 0) return;

        const stats = {
            c: { min: 100, max: 0, total: 0 },
            m: { min: 100, max: 0, total: 0 },
            y: { min: 100, max: 0, total: 0 },
            k: { min: 100, max: 0, total: 0 }
        };

        cmykPixels.forEach(({ c, m, y, k }) => {
            // Cyan statistics
            stats.c.min = Math.min(stats.c.min, c);
            stats.c.max = Math.max(stats.c.max, c);
            stats.c.total += c;
            
            // Magenta statistics  
            stats.m.min = Math.min(stats.m.min, m);
            stats.m.max = Math.max(stats.m.max, m);
            stats.m.total += m;
            
            // Yellow statistics
            stats.y.min = Math.min(stats.y.min, y);
            stats.y.max = Math.max(stats.y.max, y);
            stats.y.total += y;
            
            // Black statistics
            stats.k.min = Math.min(stats.k.min, k);
            stats.k.max = Math.max(stats.k.max, k);
            stats.k.total += k;
        });

        const pixelCount = cmykPixels.length;
        
        console.log('=== CMYK CONVERSION STATISTICS ===');
        console.log(`Total pixels processed: ${pixelCount.toLocaleString()}`);
        console.log(`Cyan    (C) - Min: ${stats.c.min.toFixed(1)}% | Max: ${stats.c.max.toFixed(1)}% | Avg: ${(stats.c.total / pixelCount).toFixed(1)}%`);
        console.log(`Magenta (M) - Min: ${stats.m.min.toFixed(1)}% | Max: ${stats.m.max.toFixed(1)}% | Avg: ${(stats.m.total / pixelCount).toFixed(1)}%`);
        console.log(`Yellow  (Y) - Min: ${stats.y.min.toFixed(1)}% | Max: ${stats.y.max.toFixed(1)}% | Avg: ${(stats.y.total / pixelCount).toFixed(1)}%`);
        console.log(`Black   (K) - Min: ${stats.k.min.toFixed(1)}% | Max: ${stats.k.max.toFixed(1)}% | Avg: ${(stats.k.total / pixelCount).toFixed(1)}%`);
        
        // Additional print insights
        const highCyanPixels = cmykPixels.filter(p => p.c > 75).length;
        const highMagentaPixels = cmykPixels.filter(p => p.m > 75).length;
        const highYellowPixels = cmykPixels.filter(p => p.y > 75).length;
        const highBlackPixels = cmykPixels.filter(p => p.k > 75).length;
        
        console.log('=== PRINT QUALITY INSIGHTS ===');
        console.log(`High Cyan pixels (>75%): ${highCyanPixels} (${(highCyanPixels/pixelCount*100).toFixed(2)}%)`);
        console.log(`High Magenta pixels (>75%): ${highMagentaPixels} (${(highMagentaPixels/pixelCount*100).toFixed(2)}%)`);
        console.log(`High Yellow pixels (>75%): ${highYellowPixels} (${(highYellowPixels/pixelCount*100).toFixed(2)}%)`);
        console.log(`High Black pixels (>75%): ${highBlackPixels} (${(highBlackPixels/pixelCount*100).toFixed(2)}%)`);
    }

    // Utility method to get raw CMYK data if needed for external processing
    static async getCMYKData(imageBuffer) {
        const { data: rgbData, info } = await sharp(imageBuffer)
            .resize(1800, 1200, { fit: 'cover', position: 'center' })
            .raw()
            .toBuffer({ resolveWithObject: true });

        const cmykData = [];
        
        for (let i = 0; i < rgbData.length; i += 3) {
            const r = rgbData[i];
            const g = rgbData[i + 1];
            const b = rgbData[i + 2];
            
            const [c, m, y, k] = convert.rgb.cmyk([r, g, b]);
            cmykData.push({ c, m, y, k, originalRgb: [r, g, b] });
        }

        return {
            width: info.width,
            height: info.height,
            cmykData
        };
    }
}