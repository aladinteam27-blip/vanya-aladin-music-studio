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
  const [showFrame, setShowFrame] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Show blue frame when playing, hide when clicking outside
  useEffect(() => {
    if (isPlaying) {
      setShowFrame(true);
    }
  }, [isPlaying]);

  // Remove frame when clicking outside
  useEffect(() => {
    if (!showFrame) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If click is not on the player button
      if (!target.closest('[data-player-button]')) {
        setShowFrame(false);
      }
    };
    
    // Delay to avoid immediate trigger
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showFrame]);

  if (!track) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  // Wave animates when playing OR hovering
  const shouldAnimateWave = isPlaying || isHovered;

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 animate-fade-in">
      <button
        data-player-button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          // Pill shape - wider horizontally, more compact height
          'flex items-center gap-2.5 px-4 py-2.5',
          'bg-charcoal text-warm-white rounded-full',
          'shadow-[0_6px_24px_rgba(0,0,0,0.25)]',
          'transition-all duration-200',
          'hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
          'active:scale-95',
          // Blue focus ring - appears on play, disappears on outside click
          showFrame && 'ring-2 ring-[hsl(230,75%,60%)] ring-offset-2 ring-offset-background'
        )}
        aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
      >
        {/* Play/Pause icon - circle with icon */}
        <span className="w-7 h-7 flex items-center justify-center border border-warm-white/25 rounded-full">
          {isPlaying ? (
            <Pause size={12} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={12} fill="currentColor" className="ml-0.5" strokeWidth={0} />
          )}
        </span>
        
        {/* Wave visualization - always visible */}
        <div className="flex items-center gap-[2px] h-5 min-w-[36px]">
          {[3, 5, 4, 7, 5, 6, 4].map((baseHeight, i) => (
            <span 
              key={i}
              className={cn(
                "w-[2px] bg-warm-white rounded-full transition-all duration-150",
                shouldAnimateWave && "animate-wave-bar"
              )}
              style={{ 
                height: shouldAnimateWave ? undefined : `${baseHeight}px`,
                animationDelay: shouldAnimateWave ? `${i * 0.1}s` : undefined,
              }}
            />
          ))}
        </div>
      </button>
    </div>
  );
});