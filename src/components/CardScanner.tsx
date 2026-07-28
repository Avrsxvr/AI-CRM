'use client';

import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, AlertCircle, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';

interface CardScannerProps {
  onScanComplete: (data: {
    name: string | null;
    company: string | null;
    title: string | null;
    email: string | null;
    phone: string | null;
    confidence: number;
    image: string;
  }) => void;
  isProcessing?: boolean;
}

export default function CardScanner({ onScanComplete, isProcessing: externalProcessing = false }: CardScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas
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
          // Compress to JPEG with 0.8 quality to avoid API payload crash
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setImage(compressedBase64);
        } else {
          // Fallback if canvas fails
          setImage(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setError('Failed to read the image file.');
    };
    reader.readAsDataURL(file);
  };

  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  const triggerUploadInput = () => {
    uploadInputRef.current?.click();
  };

  const handleScan = async () => {
    if (!image) return;

    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch('/api/leads/card-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse card. Please try again.');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message || 'Scanning failed.');
      }

      onScanComplete({
        name: result.data.name,
        company: result.data.company,
        title: result.data.title,
        email: result.data.email,
        phone: result.data.phone,
        confidence: typeof result.data.confidence_score === 'number' ? result.data.confidence_score : 100,
        image,
      });
      // Optionally clear image here if we want it to reset after success
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setImage(null);
    setError(null);
    setIsScanning(false);
  };

  const isBusy = isScanning || externalProcessing;

  if (externalProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 bg-indigo-950/20 border border-indigo-500/20 rounded-3xl w-full h-[184px]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-sm font-medium text-zinc-300">Extracting fields...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={uploadInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {!image ? (
        <div className="w-full flex gap-3 h-[184px]">
          <button
            onClick={triggerCameraInput}
            className="flex-1 relative flex flex-col items-center justify-center p-4 rounded-3xl bg-zinc-900 border-2 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition-all duration-300 group overflow-hidden"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 mb-3 group-hover:scale-105 transition-transform duration-300">
              <Camera className="w-6 h-6 text-zinc-400 group-hover:text-zinc-300" />
            </div>
            <span className="text-sm font-bold tracking-wide text-zinc-100 group-hover:text-white text-center">
              TAKE PHOTO
            </span>
          </button>

          <button
            onClick={triggerUploadInput}
            className="flex-1 relative flex flex-col items-center justify-center p-4 rounded-3xl bg-zinc-900 border-2 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 transition-all duration-300 group overflow-hidden"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 mb-3 group-hover:scale-105 transition-transform duration-300">
              <ImageIcon className="w-6 h-6 text-zinc-400 group-hover:text-zinc-300" />
            </div>
            <span className="text-sm font-bold tracking-wide text-zinc-100 group-hover:text-white text-center">
              UPLOAD FILE
            </span>
          </button>
        </div>
      ) : (
        <div className="w-full rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950/80 p-2 shadow-2xl relative group">
          <div className="relative rounded-2xl overflow-hidden aspect-[1.5/1] bg-black flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={image} 
              alt="Business card preview" 
              className={`max-h-full max-w-full object-cover transition-opacity duration-500 ${isBusy ? 'opacity-40 blur-sm' : 'opacity-100'}`}
            />
            
            {isBusy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_#6366f1] animate-[scan_2s_ease-in-out_infinite]"></div>
                <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-xl" />
                <span className="text-white font-semibold mt-2 drop-shadow-md tracking-wider text-sm uppercase">Analyzing</span>
              </div>
            )}
          </div>

          {!isBusy && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={resetScanner}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleScan}
                className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 neon-glow-primary"
              >
                <Sparkles className="w-4 h-4" />
                Extract Details
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 w-full p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
