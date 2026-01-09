import { memo, useState, useEffect, useRef } from 'react';
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
  const playerRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(true);

  // Show blue frame when playing
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
      if (!target.closest('[data-player-button]')) {
        setShowFrame(false);
      }
    };
    
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showFrame]);

  // CANONICAL: Stop before footer - player doesn't overlap footer
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      const player = playerRef.current;
      if (!footer || !player) return;

      const footerRect = footer.getBoundingClientRect();
      const playerHeight = player.offsetHeight + 48; // 48px = bottom offset + margin
      
      // If footer is visible and close to player position
      if (footerRect.top < window.innerHeight - playerHeight) {
        setIsSticky(false);
      } else {
        setIsSticky(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!track) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const shouldAnimateWave = isPlaying || isHovered;

  return (
    <div 
      ref={playerRef}
      className={cn(
        "z-50 animate-fade-in transition-all duration-300",
        isSticky 
          ? "fixed bottom-6 right-6 md:bottom-8 md:right-8" 
          : "absolute right-6 md:right-8"
      )}
      style={!isSticky ? { bottom: 'auto', transform: 'translateY(-100%)' } : undefined}
    >
      <button
        data-player-button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'flex items-center gap-2.5 px-4 py-2.5',
          'bg-foreground text-background rounded-full',
          'shadow-[0_8px_32px_rgba(0,0,0,0.35)]',
          'transition-all duration-200',
          'hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]',
          'active:scale-95',
          showFrame && 'ring-2 ring-[hsl(var(--brand-blue))] ring-offset-2 ring-offset-background'
        )}
        aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
      >
        {/* Play/Pause icon */}
        <span className="w-7 h-7 flex items-center justify-center border border-background/25 rounded-full">
          {isPlaying ? (
            <Pause size={12} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={12} fill="currentColor" className="ml-0.5" strokeWidth={0} />
          )}
        </span>
        
        {/* Wave visualization */}
        <div className="flex items-center gap-[2px] h-5 min-w-[36px]">
          {[3, 5, 4, 7, 5, 6, 4].map((baseHeight, i) => (
            <span 
              key={i}
              className={cn(
                "w-[2px] bg-background rounded-full transition-all duration-150",
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
