import { 
  useState, 
  useRef, 
  useCallback, 
  memo,
  useEffect,
  type TouchEvent,
  type MouseEvent 
} from 'react';
import { Track } from '@/data/tracks';
import { cn } from '@/lib/utils';

interface CoverCarouselProps {
  tracks: Track[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onTrackChange?: (track: Track) => void;
}

export const CoverCarousel = memo(function CoverCarousel({
  tracks,
  currentIndex,
  onIndexChange,
  onTrackChange,
}: CoverCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProgressDragging, setIsProgressDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const lastX = useRef(0);
  const lastTime = useRef(Date.now());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cover dimensions - Lady Gaga style: large center, partial next visible
  const coverWidth = typeof window !== 'undefined' 
    ? Math.min(window.innerWidth * (isMobile ? 0.75 : 0.45), isMobile ? 340 : 500) 
    : 400;
  const coverHeight = coverWidth;
  const gap = isMobile ? 20 : 40;

  // Handle drag start
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    setStartX(clientX - translateX);
    lastX.current = clientX;
    lastTime.current = Date.now();
  }, [translateX]);

  // Handle drag move with momentum tracking
  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime.current;
    const deltaX = clientX - lastX.current;
    
    if (deltaTime > 0) {
      setVelocity(deltaX / deltaTime);
    }
    
    lastX.current = clientX;
    lastTime.current = currentTime;
    
    const newTranslateX = clientX - startX;
    // Limit drag to prevent overscroll
    const maxDrag = coverWidth * 0.6;
    setTranslateX(Math.max(-maxDrag, Math.min(maxDrag, newTranslateX)));
  }, [isDragging, startX, coverWidth]);

  // Handle drag end with inertia
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = coverWidth * 0.15;
    const velocityThreshold = 0.3;
    
    let newIndex = currentIndex;
    
    // Check velocity first for flick gesture
    if (Math.abs(velocity) > velocityThreshold) {
      newIndex = velocity > 0 
        ? Math.max(0, currentIndex - 1) 
        : Math.min(tracks.length - 1, currentIndex + 1);
    } else if (Math.abs(translateX) > threshold) {
      newIndex = translateX > 0 
        ? Math.max(0, currentIndex - 1) 
        : Math.min(tracks.length - 1, currentIndex + 1);
    }
    
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      if (onTrackChange) {
        onTrackChange(tracks[newIndex]);
      }
    }
    
    setTranslateX(0);
    setVelocity(0);
  }, [isDragging, velocity, translateX, currentIndex, tracks, coverWidth, onIndexChange, onTrackChange]);

  // Progress bar interaction
  const handleProgressClick = useCallback((clientX: number) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newIndex = Math.round(progress * (tracks.length - 1));
    onIndexChange(newIndex);
    if (onTrackChange) {
      onTrackChange(tracks[newIndex]);
    }
  }, [tracks, onIndexChange, onTrackChange]);

  // Touch events
  const onTouchStart = useCallback((e: TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse events
  const onMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const onMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const onMouseLeave = useCallback(() => {
    if (isDragging) handleDragEnd();
  }, [isDragging, handleDragEnd]);

  // Progress bar handlers
  const onProgressMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProgressDragging(true);
    handleProgressClick(e.clientX);
    
    const handleMove = (ev: globalThis.MouseEvent) => {
      handleProgressClick(ev.clientX);
    };
    
    const handleUp = () => {
      setIsProgressDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [handleProgressClick]);

  const onProgressTouchStart = useCallback((e: TouchEvent) => {
    e.stopPropagation();
    handleProgressClick(e.touches[0].clientX);
  }, [handleProgressClick]);

  // Calculate cover position - Lady Gaga style: large center, peek of next
  const getCardStyle = (index: number): React.CSSProperties | null => {
    const diff = index - currentIndex;
    const dragProgress = isDragging ? translateX / coverWidth : 0;
    const adjustedDiff = diff - dragProgress;
    
    // Show current, next, and previous
    if (Math.abs(adjustedDiff) > 1.8) {
      return null;
    }
    
    const absAdjustedDiff = Math.abs(adjustedDiff);
    const isCenter = absAdjustedDiff < 0.2;
    
    // X position: center is at 0, sides are offset
    const baseOffset = adjustedDiff * (coverWidth + gap);
    
    // Scale: center full size, sides slightly smaller
    const scale = isCenter ? 1 : Math.max(0.85, 1 - absAdjustedDiff * 0.15);
    
    // Opacity: center bright, sides dimmed
    const opacity = isCenter ? 1 : Math.max(0.4, 1 - absAdjustedDiff * 0.6);
    
    // Z-index
    const zIndex = 10 - Math.abs(Math.round(adjustedDiff));
    
    return {
      transform: `translateX(${baseOffset}px) scale(${scale})`,
      opacity,
      zIndex,
      transition: isDragging 
        ? 'none' 
        : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out',
      width: coverWidth,
      height: coverHeight,
      willChange: 'transform, opacity',
    };
  };

  const currentTrack = tracks[currentIndex];
  const progressPercent = tracks.length > 1 ? (currentIndex / (tracks.length - 1)) * 100 : 0;

  return (
    <div className="relative w-full h-screen min-h-[600px] max-h-[950px] flex flex-col bg-cream overflow-hidden">
      {/* Left sidebar with track names - desktop only */}
      <div className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 flex-col gap-2">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            onClick={() => {
              onIndexChange(index);
              if (onTrackChange) onTrackChange(track);
            }}
            className={cn(
              'text-left text-sm font-medium transition-all duration-300',
              'hover:text-charcoal',
              index === currentIndex 
                ? 'text-charcoal border border-charcoal px-2 py-0.5 rounded' 
                : 'text-charcoal/40'
            )}
          >
            {track.title}
          </button>
        ))}
      </div>

      {/* Main carousel area */}
      <div className="flex-1 flex items-center justify-center pt-20">
        <div
          ref={containerRef}
          className={cn(
            'relative flex items-center justify-center w-full h-full touch-pan-x select-none',
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {/* Covers */}
          <div className="relative flex items-center justify-center">
            {tracks.map((track, index) => {
              const style = getCardStyle(index);
              if (!style) return null;
              
              return (
                <div
                  key={track.id}
                  className="absolute"
                  style={style}
                >
                  {/* Square cover - no border radius */}
                  <div 
                    className="w-full h-full overflow-hidden select-none"
                    style={{
                      boxShadow: '0 25px 80px -20px rgba(0,0,0,0.3)',
                    }}
                  >
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Track title - mobile only, under carousel */}
      <div className="md:hidden text-center pb-4">
        <h2 className="text-xl font-semibold text-charcoal">
          {currentTrack?.title}
        </h2>
      </div>

      {/* Progress bar - like Lady Gaga site */}
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 z-20 w-[80%] max-w-[600px]">
        <div
          ref={progressRef}
          className="relative h-[2px] bg-charcoal/20 cursor-pointer"
          onMouseDown={onProgressMouseDown}
          onTouchStart={onProgressTouchStart}
        >
          {/* Active progress */}
          <div 
            className="absolute top-0 left-0 h-full bg-charcoal transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
          
          {/* Drag handle - subtle */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-charcoal',
              'transition-transform duration-150',
              isProgressDragging && 'scale-125'
            )}
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
        </div>
      </div>
    </div>
  );
});
