'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
}

export default function AudioPlayer({ src }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.volume = volume;

    const handleLoadedMetadata = () => {
      if (audio.duration === Infinity) {
        // Chromium WebM duration fix: seek to the end to force browser to parse duration
        audio.currentTime = 1e101;
        
        const getDuration = () => {
          audio.removeEventListener('timeupdate', getDuration);
          setDuration(audio.currentTime);
          audio.currentTime = 0;
        };
        audio.addEventListener('timeupdate', getDuration);
      } else {
        setDuration(audio.duration || 0);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Load audio
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Playback failed:", err));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = parseFloat(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const muteState = !isMuted;
    audioRef.current.muted = muteState;
    setIsMuted(muteState);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-white/90 border border-slate-200/80 px-4 py-2.5 rounded-2xl w-full">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      {/* Time Display */}
      <span className="text-[10px] font-mono text-slate-500 select-none flex-shrink-0 w-24">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Progress Bar Slider */}
      <input
        ref={progressRef}
        type="range"
        min="0"
        max={duration || 100}
        value={currentTime}
        onChange={handleSeek}
        className="flex-1 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none outline-none"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((currentTime / (duration || 1)) * 100).toFixed(2)}%, #27272a ${((currentTime / (duration || 1)) * 100).toFixed(2)}%, #27272a 100%)`
        }}
      />

      {/* Mute/Volume Button */}
      <button
        onClick={toggleMute}
        className="p-1 rounded text-slate-500 hover:text-slate-900 transition-colors flex-shrink-0"
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
