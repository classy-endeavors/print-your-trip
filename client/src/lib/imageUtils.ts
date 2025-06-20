// Utility functions for image processing and upload
import heic2any from "heic2any";
import type { Crop } from "react-image-crop";

export const TARGET_WIDTH = 1800;
export const TARGET_HEIGHT = 1200;
export const TARGET_ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT;

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  const convertedBlob = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.8,
  });
  return new File(
    [convertedBlob as Blob],
    file.name.replace(/\.heic$/i, ".jpg"),
    {
      type: "image/jpeg",
    },
  );
};

export const calculateInitialCrop = (
  displayWidth: number,
  displayHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): Crop => {
  const TARGET_ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT;
  const photoAspectRatio = naturalWidth / naturalHeight;
  let width: number;
  let height: number;
  let x: number;
  let y: number;

  if (photoAspectRatio > TARGET_ASPECT_RATIO) {
    // Image is wider than target ratio
    height = displayHeight;
    width = height * TARGET_ASPECT_RATIO;
    x = (displayWidth - width) / 2;
    y = 0;
  } else {
    // Image is taller than target ratio
    width = displayWidth;
    height = width / TARGET_ASPECT_RATIO;
    x = 0;
    y = (displayHeight - height) / 2;
  }

  return {
    unit: "px",
    width,
    height,
    x,
    y,
  };
};

export const getCroppedImg = (
  image: HTMLImageElement,
  crop: Crop,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = image.src;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No 2d context"));
        return;
      }

      // Calculate scaling factors between displayed and natural dimensions
      const scaleX = img.naturalWidth / image.width;
      const scaleY = img.naturalHeight / image.height;

      // Draw the cropped image at the target size
      ctx.drawImage(
        img,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        TARGET_WIDTH,
        TARGET_HEIGHT,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(URL.createObjectURL(blob));
        },
        "image/jpeg",
        0.95,
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
};
