"use client";

import React, { useState, useEffect } from "react";
import { ImagePlus, X, AlertCircle } from "lucide-react";
import { validateImageFile } from "@/lib/browserImageCompression";

interface ImageUploadFieldProps {
  label: string;
  orientation?: "portrait" | "landscape";
  currentFile: File | null;
  onFileSelect: (file: File | null) => void;
  existingUrl?: string;
  onClearExisting?: () => void;
}

export default function ImageUploadField({ label, orientation = "landscape", currentFile, onFileSelect, existingUrl, onClearExisting }: ImageUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentFile) {
      setPreview(existingUrl || null);
      return;
    }

    const objectUrl = URL.createObjectURL(currentFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl); // Prevent memory leaks
  }, [currentFile, existingUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    
    if (!file) {
      onFileSelect(null);
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      onFileSelect(null);
      return;
    }

    onFileSelect(file);
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (existingUrl && onClearExisting) {
      onClearExisting();
    }
    setError(null);
  };

  const aspectClass = orientation === "portrait" ? "aspect-[3/4] max-w-[240px]" : "aspect-[4/3] w-full";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">
        {label}
        <span className="text-xs text-blue-500 font-normal ml-2 block sm:inline mt-1 sm:mt-0">
          (บีบอัดภาพอัตโนมัติก่อนอัปโหลด)
        </span>
      </label>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
          <AlertCircle size={14} className="flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!preview ? (
        <div className="relative group overflow-hidden">
          <label className="cursor-pointer block border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-colors p-6">
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange} 
              className="hidden" 
            />
            <div className={`mx-auto flex flex-col items-center justify-center text-center ${aspectClass}`}>
              <ImagePlus size={32} className="text-gray-400 group-hover:text-blue-500 mb-3 transition-colors" />
              <p className="text-sm font-medium text-gray-600">คลิกเพื่อเลือกไฟล์รูปภาพ</p>
              <p className="text-xs text-gray-400 mt-1">
                {orientation === "portrait" ? "แนวตั้ง (Portrait)" : "แนวนอน (Landscape)"}
              </p>
            </div>
          </label>
        </div>
      ) : (
        <div className={`relative rounded-xl border border-gray-200 bg-gray-50 overflow-hidden shadow-sm ${aspectClass}`}>
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2.5 bg-white text-red-600 hover:bg-red-50 hover:scale-105 active:scale-95 transition-all rounded-full shadow-lg flex items-center gap-2 font-medium text-sm"
              title="ลบรูปภาพ"
            >
              <X size={18} />
              ลบรูปภาพ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
