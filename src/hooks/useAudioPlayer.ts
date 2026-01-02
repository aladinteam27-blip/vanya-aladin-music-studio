import { useState, useRef, useCallback, useEffect } from 'react';
import { Track } from '@/data/tracks';

const FADE_DURATION = 300; // ms for crossfade

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();
  const fadeIntervalRef = useRef<number>();

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      const progressPercent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(progressPercent) ? 0 : progressPercent);
      
      if (audioRef.current.currentTime >= 20) {
        pause();
        setProgress(0);
        return;
      }
      
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  // Smooth fade out current audio
  const fadeOut = useCallback((audio: HTMLAudioElement, onComplete?: () => void) => {
    const startVolume = audio.volume;
    const steps = 15;
    const stepDuration = FADE_DURATION / steps;
    let currentStep = 0;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    fadeIntervalRef.current = window.setInterval(() => {
      currentStep++;
      const newVolume = Math.max(0, startVolume * (1 - currentStep / steps));
      audio.volume = newVolume;

      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        audio.pause();
        audio.volume = startVolume;
        onComplete?.();
      }
    }, stepDuration);
  }, []);

  // Smooth fade in new audio
  const fadeIn = useCallback((audio: HTMLAudioElement, targetVolume: number) => {
    audio.volume = 0;
    const steps = 15;
    const stepDuration = FADE_DURATION / steps;
    let currentStep = 0;

    const interval = window.setInterval(() => {
      currentStep++;
      const newVolume = Math.min(targetVolume, targetVolume * (currentStep / steps));
      audio.volume = newVolume;

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);
  }, []);

  const play = useCallback((track: Track) => {
    const targetVolume = 0.7;

    // If same track, just resume
    if (currentTrack?.id === track.id && audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          fadeIn(audioRef.current!, targetVolume);
          animationRef.current = requestAnimationFrame(updateProgress);
        })
        .catch(() => setIsPlaying(false));
      return;
    }

    // Crossfade: fade out old, then start new
    const startNew = () => {
      audioRef.current = new Audio(track.audioPreviewUrl);
      audioRef.current.volume = 0;
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
      });

      audioRef.current.addEventListener('error', () => {
        setIsPlaying(false);
        setProgress(0);
      });

      setCurrentTrack(track);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          fadeIn(audioRef.current!, targetVolume);
          animationRef.current = requestAnimationFrame(updateProgress);
        })
        .catch(() => setIsPlaying(false));
    };

    if (audioRef.current && isPlaying) {
      // Crossfade
      cancelAnimationFrame(animationRef.current!);
      fadeOut(audioRef.current, startNew);
    } else {
      // No previous audio, just start
      if (audioRef.current) {
        audioRef.current.pause();
        cancelAnimationFrame(animationRef.current!);
      }
      startNew();
    }
  }, [currentTrack, isPlaying, fadeIn, fadeOut, updateProgress]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      // Smooth fade out on pause
      fadeOut(audioRef.current, () => {
        cancelAnimationFrame(animationRef.current!);
      });
    }
    setIsPlaying(false);
  }, [fadeOut]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      cancelAnimationFrame(animationRef.current!);
    }
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const toggle = useCallback((track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      play(track);
    }
  }, [currentTrack, isPlaying, pause, play]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  return {
    isPlaying,
    currentTrack,
    progress,
    play,
    pause,
    stop,
    toggle,
  };
}
