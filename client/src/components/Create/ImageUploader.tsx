import React, { useState, useRef } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  TARGET_ASPECT_RATIO,
  convertHeicToJpeg,
  calculateInitialCrop,
  getCroppedImg,
} from "../../lib/imageUtils";
import api from "../../lib/api";
import Button from "../Button";
import LoadingBar from "./LoadingBar";
import Check from "../icons/Check";

type View =
  | "upload"
  | "convertingHeic"
  | "cropping"
  | "preview"
  | "error"
  | "uploading"
  | "success";

const ImageUploader: React.FC = () => {
  const [view, setView] = useState<View>("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedS3Path, setUploadedS3Path] = useState<string | null>(null);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const [scale, setScale] = useState(1);

  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setView("upload");
    setSelectedImage(null);
    setCrop(undefined);
    setCroppedImage(null);
    setUploadProgress(0);
    setError(null);
    setUploadedS3Path(null);
    setIsConvertingPdf(false);
    setScale(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetState();
    let processedFile = file;

    if (
      file.type === "image/heic" ||
      file.name.toLowerCase().endsWith(".heic")
    ) {
      setView("convertingHeic");
      try {
        processedFile = await convertHeicToJpeg(file);
      } catch (err) {
        setError("Failed to convert HEIC. Please try a different file type.");
        setView("error");
        return;
      }
    }

    const image = new Image();
    image.src = URL.createObjectURL(processedFile);
    image.onload = () => {
      // Validation: Check for landscape orientation
      if (image.naturalWidth < image.naturalHeight) {
        setError(
          "Portrait photos are not supported. Please upload a photo with a landscape orientation.",
        );
        setSelectedImage(image.src); // To show the invalid image
        setView("error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setView("cropping");
      };
      reader.readAsDataURL(processedFile);
    };
    image.onerror = () => {
      setError("Could not load image. The file may be corrupt.");
      setView("error");
    };
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setScale(1); // Reset scale on new image
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    const initialCrop = calculateInitialCrop(
      width,
      height,
      naturalWidth,
      naturalHeight,
    );
    setCrop(initialCrop);
  };

  const handlePreview = async () => {
    if (!imageRef.current || !crop) return;

    try {
      const finalCroppedImage = await getCroppedImg(imageRef.current, crop);
      setCroppedImage(finalCroppedImage);
      setView("preview");
    } catch (err) {
      console.error("Cropping failed", err);
      setError("Could not crop image. Please try again.");
      setView("error");
    }
  };

  const handleUpload = async () => {
    if (!croppedImage) return;

    setView("uploading");
    setUploadProgress(0);

    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("image", blob, "image.jpg");

      const uploadResponse = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total ?? 1),
          );
          setUploadProgress(percent);
        },
      });

      setUploadedS3Path(uploadResponse.data.s3Path);
      setView("success");
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
      setView("error");
    }
  };

  const handleExportPdf = async () => {
    if (!uploadedS3Path) return;
    setIsConvertingPdf(true);
    try {
      const response = await api.post("/convert", { s3Path: uploadedS3Path });
      const { pdfDownloadUrl } = response.data;

      // Fetch the PDF as a blob to force download
      const pdfResponse = await fetch(pdfDownloadUrl);
      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "postcard.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to generate PDF. Please try again.");
      setView("error"); // Revert to error state
    } finally {
      setIsConvertingPdf(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="flex w-[25rem] max-w-[90vw] flex-col items-center rounded-xl bg-background-hero p-6">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.heic,.HEIC"
          onChange={handleImageUpload}
        />

        {view === "upload" && (
          <div className="flex w-full flex-col items-center justify-center space-y-4 text-center">
            <h2 className="mb-2 text-lg font-semibold text-black">
              Upload Your Photo
            </h2>
            <div
              className="relative w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-4"
              onClick={triggerFileUpload}
            >
              <img
                src="/src/assets/hero-z-0.jpg"
                alt="Safe area placeholder"
                className="rounded-lg"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-md bg-white px-2 py-1 text-sm font-medium text-gray-600 shadow-sm">
                  SAFE AREA
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Upload any landscape photo taken from your iPhone
            </p>
            <Button
              onClick={triggerFileUpload}
              className="w-full rounded-full bg-button-green py-2 text-lg font-medium text-white transition-colors duration-200"
            >
              Choose Photo
            </Button>
          </div>
        )}

        {view === "convertingHeic" && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-lg font-semibold text-gray-800">
              Converting HEIC image...
            </p>
            <div className="w-full max-w-md rounded-full bg-gray-200">
              <div className="h-4 animate-pulse rounded-full bg-button-green"></div>
            </div>
          </div>
        )}

        {view === "cropping" && selectedImage && (
          <div className="w-full space-y-4">
            <h2 className="text-center text-lg font-semibold text-black">
              Crop Your Photo
            </h2>
            <div className="relative w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 p-2">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={TARGET_ASPECT_RATIO}
                locked
              >
                <img
                  ref={imageRef}
                  src={selectedImage}
                  onLoad={handleImageLoad}
                  alt="Crop preview"
                  className="h-auto w-full"
                  style={{ transform: `scale(${scale})` }}
                />
              </ReactCrop>
            </div>
            <div className="mx-auto flex w-full max-w-sm items-center space-x-4">
              <span className="text-sm text-gray-600">Zoom</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-button-green"
              />
            </div>
            <div className="flex w-full flex-col space-y-2">
              <Button
                onClick={handlePreview}
                className="w-full rounded-full bg-button-green py-2 text-lg font-medium text-white transition-colors duration-200"
              >
                Save Photo
              </Button>
              <Button onClick={resetState} variant="outline">
                Change Photo
              </Button>
            </div>
          </div>
        )}

        {view === "preview" && croppedImage && (
          <div className="w-full space-y-4">
            <h2 className="text-center text-lg font-semibold text-black">
              Your Postcard Preview
            </h2>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <img
                src={croppedImage}
                alt="Cropped preview"
                className="h-auto w-full"
              />
            </div>
            <p className="mt-2 text-center text-sm text-gray-600">
              This is how your postcard will look when printed.
            </p>
            <div className="flex w-full flex-col space-y-2">
              <Button
                onClick={handleUpload}
                className="w-full rounded-full bg-button-green py-2 text-lg font-medium text-white transition-colors duration-200"
              >
                Save and Continue
              </Button>
              <Button onClick={() => setView("cropping")} variant="outline">
                Re-crop Photo
              </Button>
            </div>
          </div>
        )}

        {(view === "error" || (view === "cropping" && error)) && (
          <div className="flex w-full flex-col items-center justify-center space-y-4 text-center">
            <div className="relative w-full max-w-lg rounded-lg border-2 border-dashed border-red-400 p-4">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Error preview"
                  className="rounded-lg opacity-40"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-opacity-90 rounded-lg bg-white p-6 text-center text-red-600 shadow-xl">
                  <p className="font-bold">{error}</p>
                </div>
              </div>
            </div>
            <Button
              onClick={resetState}
              className="w-full rounded-full bg-button-green py-2 text-lg font-medium text-white transition-colors duration-200"
            >
              Try a different photo
            </Button>
          </div>
        )}

        {view === "uploading" && <LoadingBar progress={uploadProgress} />}

        {view === "success" && (
          <div className="flex w-full flex-col items-center justify-center space-y-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-10 w-10" color="#6B8F6E" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Upload Complete!
            </h2>
            <p className="text-gray-600">
              Your photo has been saved. You can now convert it to a print-ready
              PDF.
            </p>
            <Button
              onClick={handleExportPdf}
              disabled={isConvertingPdf}
              className="w-full rounded-full bg-button-green py-2 text-lg font-medium text-white transition-colors duration-200"
            >
              {isConvertingPdf ? "Converting..." : "Convert and Download PDF"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
