'use client';

import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, AlertCircle, Layers } from 'lucide-react';

interface BulkCardScannerProps {
  onImagesSelected: (images: string[]) => void;
  isProcessing?: boolean;
}

export default function BulkCardScanner({ onImagesSelected, isProcessing = false }: BulkCardScannerProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(reader.result as string);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image for compression.'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const compressedImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file);
          compressedImages.push(compressed);
        }
      }

      if (compressedImages.length === 0) {
        setError('No valid images were selected.');
      } else {
        onImagesSelected(compressedImages);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while preparing images.');
    } finally {
      setIsCompressing(false);
      // Reset input so the same files can be selected again if needed
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const triggerUploadInput = () => {
    if (!isProcessing && !isCompressing) {
      uploadInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/*"
        multiple
        ref={uploadInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        onClick={triggerUploadInput}
        disabled={isProcessing || isCompressing}
        className="w-full relative overflow-hidden group rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-blue-500/20 p-8 transition-all hover:bg-gradient-to-br hover:from-indigo-500/20 hover:to-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-slate-800/20 blur-xl rounded-full"></div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              {isProcessing || isCompressing ? (
                <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
              ) : (
                <Layers className="w-8 h-8 text-slate-900" />
              )}
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {isProcessing || isCompressing ? 'Preparing Images...' : 'Bulk Scan Cards'}
            </h3>
            <p className="text-sm text-slate-500">
              Select multiple business cards to process them in a batch.
            </p>
          </div>
        </div>
      </button>

      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
