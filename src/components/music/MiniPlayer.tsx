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
          'relative flex items-center gap-3 px-5 py-3 rounded-full',
          'bg-foreground text-primary-foreground shadow-player',
          'transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95',
          isPlaying && 'animate-pulse-soft'
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {/* Progress indicator */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-primary-foreground/30 rounded-full overflow-hidden w-full"
        >
          <div 
            className="h-full bg-primary-foreground transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Play/Pause icon */}
        <span className="relative z-10">
          {isPlaying ? (
            <div className="audio-wave">
              <span className="bg-primary-foreground" />
              <span className="bg-primary-foreground" />
              <span className="bg-primary-foreground" />
              <span className="bg-primary-foreground" />
            </div>
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </span>

        {/* Track title (truncated) */}
        <span className="relative z-10 text-sm font-medium max-w-[120px] truncate">
          {track.title}
        </span>
      </button>
    </div>
  );
});
