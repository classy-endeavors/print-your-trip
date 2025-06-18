export class FileUtils {
    static getBaseFilename(filename: string): string {
        return filename.substring(filename.lastIndexOf('/') + 1);
    }

    static getFolderPath(key: string): string {
        return key.substring(0, key.lastIndexOf('/') + 1);
    }

    static isValidRGBFile(filename: string): boolean {
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
        const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return filename.endsWith('-rgb' + extension) && validExtensions.includes(extension);
    }

    static getCMYKFilename(rgbFilename: string): string {
        return rgbFilename.replace('-rgb.', '-cmyk.pdf');
    }
} 