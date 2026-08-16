'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, AlertCircle, Loader2, Trash2 } from 'lucide-react';

interface RecordButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
}

export default function RecordButton({ onRecordingComplete, isProcessing = false }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopTimer();
      cleanupRecording();
    };
  }, []);

  const startTimer = () => {
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cleanupRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let options: MediaRecorderOptions | undefined = undefined;
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Only fire complete if we aren't discarding and we have chunks
        if (!discardingRef.current && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || 'audio/mp4', // Fallback for iOS
          });
          onRecordingComplete(audioBlob);
        }
        cleanupRecording();
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      startTimer();
    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setError('Could not access microphone.');
    }
  };

  // Need a ref to check in the onstop callback
  const discardingRef = useRef(false);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      discardingRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const discardRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      discardingRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
      setDuration(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 bg-indigo-950/20 border border-blue-500/20 rounded-3xl w-full h-[184px]">
        <Loader2 className="w-8 h-8 text-slate-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-700">Extracting context...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full gap-3">
      {/* Big Action Button */}
      <div className="w-full flex gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative flex flex-col items-center justify-center py-8 px-4 h-[184px] rounded-3xl transition-all duration-500 group overflow-hidden ${
            isRecording 
              ? 'bg-emerald-500/10 border-2 border-emerald-500/50 hover:bg-emerald-500/20 flex-1' 
              : 'bg-blue-600 border-2 border-transparent hover:bg-slate-800 shadow-sm w-full'
          }`}
        >
          {isRecording && (
            <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
          )}
          
          <div className={`flex items-center justify-center w-16 h-16 rounded-full mb-3 shadow-lg transition-transform duration-300 ${isRecording ? 'bg-emerald-500 scale-110 shadow-emerald-500/50' : 'bg-white/20 group-hover:scale-105'}`}>
            {isRecording ? (
              <Square className="w-6 h-6 text-slate-900 fill-current" />
            ) : (
              <Mic className="w-7 h-7 text-slate-900" />
            )}
          </div>
          
          <div className="flex flex-col items-center relative z-10">
            <span className={`text-lg font-bold tracking-wide ${isRecording ? 'text-emerald-400' : 'text-slate-900'}`}>
              {isRecording ? 'SAVE & EXTRACT' : 'RECORD CONVERSATION'}
            </span>
            {isRecording ? (
              <span className="text-sm font-mono mt-1 text-emerald-300 animate-pulse font-semibold">
                LIVE • {formatDuration(duration)}
              </span>
            ) : (
              <span className="text-sm text-indigo-200 font-medium mt-1">
                Tap to capture meeting notes
              </span>
            )}
          </div>
        </button>

        {isRecording && (
          <button
            onClick={discardRecording}
            className="w-24 h-[184px] rounded-3xl bg-red-950/30 border border-red-500/30 hover:bg-red-500/20 flex flex-col items-center justify-center gap-3 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/40 transition-colors">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-xs font-bold text-red-400 tracking-wider">DISCARD</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 w-full p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
