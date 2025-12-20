import { memo } from 'react';
import { Play } from 'lucide-react';
import { Track } from '@/data/tracks';
import { cn } from '@/lib/utils';

interface MiniPlayerProps {
  track: Track | null;
  isPlaying: boolean;
  progress: number;
  onToggle: () => void;
}

export const MiniPlayer = memo(function MiniPlayer({
  track,
  isPlaying,
  progress,
  onToggle,
}: MiniPlayerProps) {
  if (!track) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <button
        onClick={onToggle}
        className={cn(
          'relative flex items-center justify-center',
          'w-14 h-14 rounded-full',
          'bg-charcoal text-warm-white',
          'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
          'transition-none' // No hover scale/pulse on player body
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {/* Progress ring */}
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 56 56"
        >
          <circle
            cx="28"
            cy="28"
            r="25"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
          />
          <circle
            cx="28"
            cy="28"
            r="25"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 25}`}
            strokeDashoffset={`${2 * Math.PI * 25 * (1 - progress / 100)}`}
            className="transition-all duration-100 ease-linear"
          />
        </svg>

        {/* Play icon or Wave animation */}
        <span className="relative z-10 flex items-center justify-center">
          {isPlaying ? (
            <div className="audio-wave-player">
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : (
            <Play size={22} fill="currentColor" className="ml-0.5" />
          )}
        </span>
      </button>
    </div>
  );
});
