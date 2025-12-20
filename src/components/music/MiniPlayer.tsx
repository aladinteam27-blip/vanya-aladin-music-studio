import { memo } from 'react';
import { Play, Square } from 'lucide-react';
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
    <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-3 px-5 py-4 rounded-full',
          'bg-charcoal text-warm-white',
          'shadow-[0_10px_40px_rgba(0,0,0,0.35)]',
          'transition-all duration-200',
          'hover:scale-105 hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)]',
          'active:scale-95'
        )}
        aria-label={isPlaying ? 'Stop' : 'Play'}
      >
        {/* Play/Stop icon */}
        <span className="w-7 h-7 flex items-center justify-center border border-white/30 rounded-full">
          {isPlaying ? (
            <Square size={10} fill="currentColor" />
          ) : (
            <Play size={12} fill="currentColor" className="ml-0.5" />
          )}
        </span>
        
        {/* Waveform visualization */}
        <div className={cn(
          "flex items-center gap-[2px] h-6",
          isPlaying ? "audio-wave-smooth" : "opacity-40"
        )}>
          <span style={{ height: isPlaying ? undefined : '4px' }} />
          <span style={{ height: isPlaying ? undefined : '8px' }} />
          <span style={{ height: isPlaying ? undefined : '6px' }} />
          <span style={{ height: isPlaying ? undefined : '10px' }} />
          <span style={{ height: isPlaying ? undefined : '5px' }} />
          <span style={{ height: isPlaying ? undefined : '7px' }} />
          <span style={{ height: isPlaying ? undefined : '4px' }} />
        </div>
      </button>
    </div>
  );
});