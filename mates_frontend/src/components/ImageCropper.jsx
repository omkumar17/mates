"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";
import { toast } from "react-hot-toast";

// ============================================
// IMAGE CROPPER MODAL
// ============================================
// Provides a full-screen cropping interface with:
//   - Locked 9:16 aspect ratio (portrait)
//   - Zoom slider
//   - Auto-focus on face/center
//   - Canvas-based crop output
// ============================================

const ASPECT_RATIO = 9 / 16; // 9:16 portrait aspect ratio

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.loading = "eager";
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Set output dimensions (max 1080px width, maintaining 9:16)
  const maxWidth = 720;
  const outputWidth = Math.min(pixelCrop.width, maxWidth);
  const outputHeight = Math.round(outputWidth * (16 / 9));

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((location) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom) => {
    setZoom(newZoom);
  }, []);

  const onCropAreaComplete = useCallback((croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || processing) return;

    try {
      setProcessing(true);
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Convert blob to File
      const croppedFile = new File([croppedBlob], "cropped-image.jpg", {
        type: "image/jpeg",
      });

      onCropComplete(croppedFile);
    } catch (error) {
      console.error("Crop error:", error);
      toast.error("Failed to crop image. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed md:ml-64 inset-0 z-50 mb-20 md:mb-0 flex items-center justify-center  border-foreground backdrop-blur-sm overflow-auto">
      <div className="relative mx-4 border border-foreground rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b ">
          <h3 className="text-lg font-bold">Adjust Your Photo</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-2  rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative w-full aspect-square ">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT_RATIO}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
            cropShape="rect"
            showGrid={true}
            objectFit="contain"
            minZoom={0.5}
            maxZoom={3}
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-center gap-4 px-6 py-4 border-t">
          <ZoomOut size={20} className="" />
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-48 h-2  rounded-lg appearance-none cursor-pointer bg-foreground accent-pink-500"
          />
          <ZoomIn size={20} className="" />
        </div>

        {/* Hint text */}
        <p className="text-xs text-center  px-6 pb-2">
          Drag to reposition. The photo will be cropped to 9:16 portrait format.
        </p>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t ">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border  font-semibold  transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={processing}
            className="flex-1 py-3 rounded-xl bg-linear-to-r from-pink-500 to-rose-500 font-semibold hover:scale-[1.02] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check size={18} />
                Apply
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

