import PDFDocument from 'pdfkit';
import sharp from 'sharp';

export class PDFConversionService {
    static async convertToCMYK(imageBuffer) {
        console.log('=== PDF CONVERSION START ===');
        console.log(`Input image buffer size: ${imageBuffer.length}`);

        try {
            // First, ensure the image is cropped to 1800x1200 (4x6 inches at 300 DPI)
            console.log('Resizing and cropping image to 1800x1200...');
            const processedImage = await sharp(imageBuffer)
                .resize(1800, 1200, {
                    fit: 'cover',
                    position: 'center'
                })
                // Apply color profile correction and enhancement for better print output
                .modulate({
                    brightness: 1.05,  // Slight brightness boost to compensate for CMYK conversion
                    saturation: 1.15,  // Increase saturation as CMYK tends to be less vibrant
                    hue: 0
                })
                // Enhance contrast slightly for better print quality
                .linear(1.1, -5)  // Slight contrast boost
                .jpeg({ 
                    quality: 100,
                    mozjpeg: true  // Use mozjpeg for better compression
                })
                .toBuffer();

            console.log('Applying CMYK color space optimization...');
            
            // Get RGB pixel data from the processed image
            const { data: rgbData, info } = await sharp(processedImage)
                .raw()
                .toBuffer({ resolveWithObject: true });

            console.log(`Processing ${info.width}x${info.height} pixels for CMYK optimization...`);

            // Convert RGB to CMYK using improved algorithm
            const cmykPixels = [];
            const optimizedRgbData = new Uint8Array(rgbData.length);

            for (let i = 0; i < rgbData.length; i += 3) {
                const r = rgbData[i] / 255;
                const g = rgbData[i + 1] / 255;
                const b = rgbData[i + 2] / 255;
                
                // Improved CMYK conversion algorithm
                const cmyk = this.rgbToCMYKImproved(r, g, b);
                cmykPixels.push(cmyk);
                
                // Convert back to RGB with color correction for print simulation
                const printRgb = this.cmykToRGBImproved(cmyk.c, cmyk.m, cmyk.y, cmyk.k);
                
                // Apply slight gamma correction for better visual match
                optimizedRgbData[i] = Math.min(255, Math.max(0, Math.round(Math.pow(printRgb.r, 0.9) * 255)));
                optimizedRgbData[i + 1] = Math.min(255, Math.max(0, Math.round(Math.pow(printRgb.g, 0.9) * 255)));
                optimizedRgbData[i + 2] = Math.min(255, Math.max(0, Math.round(Math.pow(printRgb.b, 0.9) * 255)));
            }

            console.log(`CMYK optimization completed for ${cmykPixels.length} pixels`);
            
            // Log CMYK statistics for verification
            this.logCMYKStatistics(cmykPixels);

            // Create the final print-ready image
            console.log('Creating print-ready image buffer...');
            const printReadyImage = await sharp(optimizedRgbData, {
                raw: {
                    width: info.width,
                    height: info.height,
                    channels: 3
                }
            })
            // Apply final sharpening for print quality
            .sharpen({
                sigma: 0.5,
                m1: 0.5,
                m2: 2.0
            })
            .jpeg({ 
                quality: 100,
                mozjpeg: true
            })
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
            console.log('Embedding print-optimized image in PDF...');
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

    // Improved RGB to CMYK conversion with better black generation
    static rgbToCMYKImproved(r, g, b) {
        // Ensure values are in 0-1 range
        r = Math.max(0, Math.min(1, r));
        g = Math.max(0, Math.min(1, g));
        b = Math.max(0, Math.min(1, b));

        // Calculate initial CMY values
        let c = 1 - r;
        let m = 1 - g;
        let y = 1 - b;

        // Improved black generation - use GCR (Gray Component Replacement)
        const k = Math.min(c, m, y) * 0.8; // Use 80% of minimum for better detail retention
        
        // Adjust CMY values based on black generation
        if (k < 1) {
            const adjustment = 1 - k;
            c = Math.max(0, (c - k) / adjustment);
            m = Math.max(0, (m - k) / adjustment);
            y = Math.max(0, (y - k) / adjustment);
        } else {
            c = m = y = 0;
        }

        return {
            c: Math.round(c * 100),
            m: Math.round(m * 100),
            y: Math.round(y * 100),
            k: Math.round(k * 100)
        };
    }

    // Improved CMYK to RGB conversion with better color matching
    static cmykToRGBImproved(c, m, y, k) {
        // Convert percentages to 0-1 range
        c = c / 100;
        m = m / 100;
        y = y / 100;
        k = k / 100;

        // Improved conversion formula with color correction
        const r = (1 - c) * (1 - k);
        const g = (1 - m) * (1 - k);
        const b = (1 - y) * (1 - k);

        // Apply slight color correction for better visual match
        return {
            r: Math.max(0, Math.min(1, r * 1.02)), // Slight red boost
            g: Math.max(0, Math.min(1, g * 1.01)), // Slight green boost
            b: Math.max(0, Math.min(1, b * 1.03))  // Slight blue boost
        };
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
        
        // Calculate total ink coverage
        const totalInkCoverage = cmykPixels.reduce((sum, { c, m, y, k }) => sum + c + m + y + k, 0) / pixelCount;
        console.log(`Average total ink coverage: ${totalInkCoverage.toFixed(1)}%`);
        
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
        
        // Warn about potential print issues
        if (totalInkCoverage > 280) {
            console.log('⚠️  WARNING: High total ink coverage detected. May cause printing issues.');
        }
    }

    // Enhanced utility method to get raw CMYK data
    static async getCMYKData(imageBuffer) {
        const { data: rgbData, info } = await sharp(imageBuffer)
            .resize(1800, 1200, { fit: 'cover', position: 'center' })
            .modulate({
                brightness: 1.05,
                saturation: 1.15
            })
            .raw()
            .toBuffer({ resolveWithObject: true });

        const cmykData = [];
        
        for (let i = 0; i < rgbData.length; i += 3) {
            const r = rgbData[i] / 255;
            const g = rgbData[i + 1] / 255;
            const b = rgbData[i + 2] / 255;
            
            const cmyk = this.rgbToCMYKImproved(r, g, b);
            cmykData.push({ 
                ...cmyk, 
                originalRgb: [rgbData[i], rgbData[i + 1], rgbData[i + 2]] 
            });
        }

        return {
            width: info.width,
            height: info.height,
            cmykData
        };
    }

    // Alternative method that preserves original RGB values for comparison
    static async convertToRGB(imageBuffer) {
        console.log('=== RGB CONVERSION (No CMYK simulation) ===');
        
        const processedImage = await sharp(imageBuffer)
            .resize(1800, 1200, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 100 })
            .toBuffer();

        const metadata = await sharp(processedImage).metadata();
        const width = metadata.width || 1800;
        const height = metadata.height || 1200;

        const doc = new PDFDocument({
            size: [width, height],
            autoFirstPage: false,
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        const pdfPromise = new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
        });

        doc.addPage({
            size: [width, height],
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        doc.image(processedImage, 0, 0, { width, height });
        doc.end();

        return await pdfPromise;
    }
}