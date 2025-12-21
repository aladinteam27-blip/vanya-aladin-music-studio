import { memo, useState, useEffect } from 'react';
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

  // Determine if wave should animate
  const shouldAnimateWave = isPlaying || isHovered;

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 animate-fade-in">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          // Pill shape - wider, shorter height
          'flex items-center gap-3 px-4 py-3',
          'bg-warm-white text-charcoal rounded-full',
          'shadow-[0_4px_20px_rgba(0,0,0,0.15)]',
          'transition-all duration-200',
          'hover:shadow-[0_6px_28px_rgba(0,0,0,0.2)]',
          'active:scale-95',
          // Blue focus ring
          isFocused && 'ring-2 ring-[hsl(210,80%,55%)] ring-offset-2 ring-offset-background'
        )}
        aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
      >
        {/* Play/Pause icon - circle with icon */}
        <span className="w-8 h-8 flex items-center justify-center border border-charcoal/20 rounded-full">
          {isPlaying ? (
            <Pause size={14} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={14} fill="currentColor" className="ml-0.5" strokeWidth={0} />
          )}
        </span>
        
        {/* Wave visualization - always visible, animates on play/hover */}
        <div className="flex items-center gap-[2px] h-5 min-w-[40px]">
          {[3, 6, 4, 8, 5, 7, 4].map((baseHeight, i) => (
            <span 
              key={i}
              className={cn(
                "w-[2.5px] bg-charcoal rounded-full transition-all",
                shouldAnimateWave && "animate-wave-bar"
              )}
              style={{ 
                height: shouldAnimateWave ? undefined : `${baseHeight}px`,
                animationDelay: shouldAnimateWave ? `${i * 0.12}s` : undefined,
              }}
            />
          ))}
        </div>
      </button>
    </div>
  );
});
