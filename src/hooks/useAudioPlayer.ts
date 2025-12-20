import { useState, useRef, useCallback, useEffect } from 'react';
import { Track } from '@/data/tracks';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();

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

  const play = useCallback((track: Track) => {
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current!);
    }

    // Create new audio element
    audioRef.current = new Audio(track.audioPreviewUrl);
    audioRef.current.volume = 0.7;
    
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
        animationRef.current = requestAnimationFrame(updateProgress);
      })
      .catch(() => {
        setIsPlaying(false);
      });
  }, [updateProgress]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current!);
    }
    setIsPlaying(false);
  }, []);

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
