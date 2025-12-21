import { memo, useState, useEffect } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Remove focus when clicking outside
  useEffect(() => {
    if (!isFocused) return;
    
    const handleClickOutside = () => {
      setIsFocused(false);
    };
    
    // Delay to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isFocused]);

  if (!track) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFocused(true);
    onToggle();
  };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 animate-fade-in">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'flex flex-col items-center gap-2 px-4 py-5',
          'bg-charcoal text-warm-white rounded-2xl',
          'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
          'transition-all duration-200',
          'hover:shadow-[0_10px_40px_rgba(0,0,0,0.35)]',
          'active:scale-95',
          // Blue focus ring
          isFocused && 'ring-2 ring-blue-400/70 ring-offset-2 ring-offset-background'
        )}
        aria-label={isPlaying ? 'Остановить' : 'Воспроизвести'}
      >
        {/* Play/Stop icon */}
        <span className="w-8 h-8 flex items-center justify-center border border-white/25 rounded-full">
          {isPlaying ? (
            <Square size={12} fill="currentColor" />
          ) : (
            <Play size={14} fill="currentColor" className="ml-0.5" />
          )}
        </span>
        
        {/* Wave visualization - always visible */}
        <div className={cn(
          "flex items-center gap-[2px] h-5",
          (isPlaying || isHovered) ? "audio-wave-smooth" : ""
        )}>
          <span style={{ height: (isPlaying || isHovered) ? undefined : '3px' }} />
          <span style={{ height: (isPlaying || isHovered) ? undefined : '6px' }} />
          <span style={{ height: (isPlaying || isHovered) ? undefined : '4px' }} />
          <span style={{ height: (isPlaying || isHovered) ? undefined : '8px' }} />
          <span style={{ height: (isPlaying || isHovered) ? undefined : '5px' }} />
          <span style={{ height: (isPlaying || isHovered) ? undefined : '6px' }} />
          <span style={{ height: (isPlaying || isHovered) ? undefined : '3px' }} />
        </div>
      </button>
    </div>
  );
});
