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
          'flex items-center gap-2.5 px-4 py-3 rounded-full',
          'bg-charcoal text-warm-white',
          'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
          'transition-opacity duration-200',
          'hover:opacity-90'
        )}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {/* Play icon */}
        <span className="w-5 h-5 flex items-center justify-center border border-white/30 rounded-full">
          <Play size={10} fill="currentColor" className="ml-0.5" />
        </span>
        
        {/* Waveform visualization */}
        <div className={cn(
          "flex items-center gap-[2px] h-5",
          isPlaying ? "audio-wave-player" : "opacity-50"
        )}>
          <span className={cn(!isPlaying && "!animate-none")} style={{ height: '6px' }} />
          <span className={cn(!isPlaying && "!animate-none")} style={{ height: '12px' }} />
          <span className={cn(!isPlaying && "!animate-none")} style={{ height: '8px' }} />
          <span className={cn(!isPlaying && "!animate-none")} style={{ height: '14px' }} />
          <span className={cn(!isPlaying && "!animate-none")} style={{ height: '6px' }} />
          <span className={cn(!isPlaying && "!animate-none")} style={{ height: '10px' }} />
        </div>
      </button>
    </div>
  );
});
