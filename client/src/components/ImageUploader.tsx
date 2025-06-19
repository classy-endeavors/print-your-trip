import React, { useState, useRef } from "react";
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
  const [isConverting, setIsConverting] = useState(false);
  const [uploadedS3Path, setUploadedS3Path] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const convertHeicToJpeg = async (file: File): Promise<File> => {
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

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("Selected file:", file);
    try {
      setError(null);
      let processedFile = file;

      if (
        file.type === "image/heic" ||
        file.name.toLowerCase().endsWith(".heic") ||
        (!file.type && file.name.toLowerCase().endsWith(".heic"))
      ) {
        try {
          processedFile = await convertHeicToJpeg(file);
        } catch {
          setError(
            "Failed to convert HEIC image. Please try a different file or use a JPEG/PNG.",
          );
          return;
        }
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setIsImageLoaded(false);
        // Reset states when new image is uploaded
        setCroppedImage(null);
        setUploadedS3Path(null);
        setPdfUrl(null);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error("Error processing image:", error);
      setError("Error processing image. Please try again.");
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
      const {
        naturalWidth,
        naturalHeight,
        width: displayWidth,
        height: displayHeight,
      } = imageRef.current;
      const initialCrop = calculateInitialCrop(
        displayWidth,
        displayHeight,
        naturalWidth,
        naturalHeight,
      );
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

  const handleCropComplete = async () => {
    if (imageRef.current && crop && isImageLoaded) {
      try {
        const croppedImageUrl = await getCroppedImg(imageRef.current, crop);
        setCroppedImage(croppedImageUrl);
      } catch (error) {
        console.error("Error cropping image:", error);
        setError("Error cropping image. Please try again.");
      }
    }
  };

  const handleSavePhoto = async () => {
    if (!croppedImage) return;

    console.log("=== SAVE PHOTO START ===");
    console.log("Cropped image URL:", croppedImage);

    setIsUploading(true);
    setError(null);
    try {
      console.log("Fetching cropped image blob...");
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      console.log("Blob size:", blob.size, "Blob type:", blob.type);

      const formData = new FormData();
      formData.append("image", blob, "image.jpg");
      console.log("FormData created with image");

      console.log("Making upload request to /api/upload...");
      const uploadResponse = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Upload response:", uploadResponse.data);
      setUploadedS3Path(uploadResponse.data.s3Path);
      console.log("=== SAVE PHOTO SUCCESS ===");
    } catch (error) {
      console.error("=== SAVE PHOTO ERROR ===");
      console.error("Error details:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error response:", error.response?.data);
        console.error("Axios error status:", error.response?.status);
      }
      setError("Error uploading image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!uploadedS3Path) return;

    console.log("=== EXPORT PDF START ===");
    console.log("Uploaded S3 path:", uploadedS3Path);

    setIsConverting(true);
    setError(null);
    try {
      console.log("Making convert request to /api/convert...");
      const response = await axios.post("/api/convert", {
        s3Path: uploadedS3Path,
      });

      console.log("Convert response:", response.data);
      setPdfUrl(response.data.downloadUrl);
      console.log("=== EXPORT PDF SUCCESS ===");
    } catch (error) {
      console.error("=== EXPORT PDF ERROR ===");
      console.error("Error details:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error response:", error.response?.data);
        console.error("Axios error status:", error.response?.status);
      }
      setError("Error converting to PDF. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      {/* Mobile-optimized file upload area */}
      <div className="mb-6">
        <label className="block w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50">
          <div className="flex flex-col items-center space-y-2">
            <svg
              className="h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Tap to upload
              </span>{" "}
              or drag and drop
            </div>
            <p className="text-xs text-gray-500">HEIC, JPEG, PNG up to 10MB</p>
          </div>
          <input
            type="file"
            accept="image/*,.heic,.HEIC"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Crop your photo
          </h3>
          <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={handleCropComplete}
              aspect={TARGET_ASPECT_RATIO}
              locked={true}
              className="max-w-full"
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
          <p className="mt-2 text-sm text-gray-600">
            Drag to adjust the crop area. The image will be resized to 1800×1200
            pixels.
          </p>
        </div>
      )}

      {croppedImage && (
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Preview</h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <img src={croppedImage} alt="Cropped" className="h-auto w-full" />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            This is how your postcard will look when printed.
          </p>
        </div>
      )}

      {/* Mobile-optimized action buttons */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
        <button
          onClick={handleSavePhoto}
          disabled={!croppedImage || isUploading}
          className={`flex-1 rounded-lg px-6 py-4 text-base font-semibold text-white shadow-sm transition-colors ${
            !croppedImage || isUploading
              ? "cursor-not-allowed bg-gray-400"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
          }`}
        >
          {isUploading ? (
            <div className="flex items-center justify-center">
              <svg
                className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Uploading...
            </div>
          ) : (
            "Save Photo"
          )}
        </button>

        {uploadedS3Path && (
          <button
            onClick={handleExportPDF}
            disabled={isConverting}
            className={`flex-1 rounded-lg px-6 py-4 text-base font-semibold text-white shadow-sm transition-colors ${
              isConverting
                ? "cursor-not-allowed bg-gray-400"
                : "bg-green-600 hover:bg-green-700 active:bg-green-800"
            }`}
          >
            {isConverting ? (
              <div className="flex items-center justify-center">
                <svg
                  className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Converting...
              </div>
            ) : (
              "Export PDF"
            )}
          </button>
        )}
      </div>

      {pdfUrl && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-center">
            <svg
              className="h-6 w-6 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-green-800">
                PDF Ready!
              </h3>
              <p className="text-sm text-green-700">
                Your CMYK PDF is ready for download.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href={pdfUrl}
              download
              className="inline-flex items-center rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-green-700 active:bg-green-800"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download CMYK PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
