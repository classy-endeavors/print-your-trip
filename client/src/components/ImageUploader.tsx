import React, { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import type { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import axios from 'axios';

const ImageUploader: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 1800,
    height: 1200,
    x: 0,
    y: 0
  });
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<string> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg');
    });
  };

  const handleCropComplete = async () => {
    if (imageRef.current && crop) {
      const croppedImageUrl = await getCroppedImg(imageRef.current, crop);
      setCroppedImage(croppedImageUrl);
    }
  };

  const handleSavePhoto = async () => {
    if (!croppedImage) return;

    setIsUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');

      // Upload to backend
      const uploadResponse = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPdfUrl(uploadResponse.data.pdfUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {selectedImage && (
        <div className="mb-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={handleCropComplete}
            aspect={1800/1200}
          >
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Upload"
              className="max-w-full h-auto"
            />
          </ReactCrop>
        </div>
      )}

      {croppedImage && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Preview:</h3>
          <img
            src={croppedImage}
            alt="Cropped"
            className="max-w-full h-auto border border-gray-300"
          />
        </div>
      )}

      <button
        onClick={handleSavePhoto}
        disabled={!croppedImage || isUploading}
        className={`px-4 py-2 rounded-md text-white font-semibold ${
          !croppedImage || isUploading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Save Photo'}
      </button>

      {pdfUrl && (
        <div className="mt-4">
          <a
            href={pdfUrl}
            download
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Download CMYK PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 