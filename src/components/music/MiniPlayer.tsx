import { memo } from 'react';
import { Play, Pause } from 'lucide-react';
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
          'relative flex items-center gap-3 px-5 py-3 rounded-full',
          'bg-[hsl(0,0%,12%)] text-[hsl(45,40%,99%)]',
          'shadow-[0_8px_32px_rgba(0,0,0,0.25)]',
          'transition-transform duration-200 ease-out',
          'hover:scale-105 active:scale-95'
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 h-0.5 bg-white/20 rounded-full overflow-hidden w-full">
          <div 
            className="h-full bg-white/60 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Play/Pause icon or Wave animation */}
        <span className="relative z-10 w-5 h-5 flex items-center justify-center">
          {isPlaying ? (
            <div className="audio-wave-player">
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5" />
          )}
        </span>

        {/* Track title (truncated) */}
        <span className="relative z-10 text-sm font-normal max-w-[100px] truncate">
          {track.title}
        </span>
      </button>
    </div>
  );
});
