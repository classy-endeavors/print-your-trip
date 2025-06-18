import React, { useState, useRef, useEffect } from "react";
import ReactCrop from "react-image-crop";
import type { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import axios from "axios";
import heic2any from "heic2any";

const TARGET_WIDTH = 1800;
const TARGET_HEIGHT = 1200;
const TARGET_ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT; // 1.5

const ImageUploader: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "px",
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    x: 0,
    y: 0,
  });
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
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
    } catch (error) {
      console.error("Error converting HEIC to JPEG:", error);
      throw error;
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let processedFile = file;

      if (
        file.type === "image/heic" ||
        file.name.toLowerCase().endsWith(".heic")
      ) {
        processedFile = await convertHeicToJpeg(file);
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setIsImageLoaded(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const calculateInitialCrop = (
    displayWidth: number,
    displayHeight: number,
    naturalWidth: number,
    naturalHeight: number,
  ): Crop => {
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

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight, width: displayWidth, height: displayHeight } = imageRef.current;
      const initialCrop = calculateInitialCrop(displayWidth, displayHeight, naturalWidth, naturalHeight);
      setCrop(initialCrop);
      setIsImageLoaded(true);
    }
  };

  const getCroppedImg = (
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
          TARGET_HEIGHT
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

  const handleCropComplete = async () => {
    if (imageRef.current && crop && isImageLoaded) {
      try {
        const croppedImageUrl = await getCroppedImg(imageRef.current, crop);
        setCroppedImage(croppedImageUrl);
      } catch (error) {
        console.error("Error cropping image:", error);
      }
    }
  };

  const handleSavePhoto = async () => {
    if (!croppedImage) return;

    setIsUploading(true);
    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("image", blob, "image.jpg");

      const uploadResponse = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setPdfUrl(uploadResponse.data.pdfUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {selectedImage && (
        <div className="mb-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={handleCropComplete}
            aspect={TARGET_ASPECT_RATIO}
            locked={true}
          >
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Upload"
              className="h-auto max-w-full"
              onLoad={handleImageLoad}
            />
          </ReactCrop>
        </div>
      )}

      {croppedImage && (
        <div className="mb-4">
          <h3 className="mb-2 text-lg font-semibold">Preview:</h3>
          <img
            src={croppedImage}
            alt="Cropped"
            className="h-auto max-w-full border border-gray-300"
          />
        </div>
      )}

      <button
        onClick={handleSavePhoto}
        disabled={!croppedImage || isUploading}
        className={`rounded-md px-4 py-2 font-semibold text-white ${
          !croppedImage || isUploading
            ? "cursor-not-allowed bg-gray-400"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isUploading ? "Uploading..." : "Save Photo"}
      </button>

      {pdfUrl && (
        <div className="mt-4">
          <a
            href={pdfUrl}
            download
            className="text-blue-600 underline hover:text-blue-800"
          >
            Download CMYK PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
