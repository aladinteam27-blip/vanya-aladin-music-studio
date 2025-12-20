import { 
  useState, 
  useRef, 
  useCallback, 
  memo,
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
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const lastX = useRef(0);
  const lastTime = useRef(Date.now());

  // Cover size based on viewport - larger for fullscreen feel
  const coverSize = typeof window !== 'undefined' 
    ? Math.min(window.innerWidth * 0.55, 380) 
    : 320;
  const sideCoverSize = coverSize * 0.7;
  const gap = 40;

  // Handle drag start
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    setStartX(clientX - translateX);
    lastX.current = clientX;
    lastTime.current = Date.now();
  }, [translateX]);

  // Handle drag move
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
    setTranslateX(newTranslateX);
  }, [isDragging, startX]);

  // Handle drag end with inertia
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = coverSize / 4;
    const velocityThreshold = 0.25;
    
    let newIndex = currentIndex;
    
    // Consider both position and velocity for natural feel
    if (Math.abs(velocity) > velocityThreshold) {
      newIndex = velocity > 0 
        ? Math.max(0, currentIndex - 1) 
        : Math.min(tracks.length - 1, currentIndex + 1);
    } else if (Math.abs(translateX) > threshold) {
      newIndex = translateX > 0 
        ? Math.max(0, currentIndex - 1) 
        : Math.min(tracks.length - 1, currentIndex + 1);
    }
    
    onIndexChange(newIndex);
    if (onTrackChange) {
      onTrackChange(tracks[newIndex]);
    }
    setTranslateX(0);
    setVelocity(0);
  }, [isDragging, velocity, translateX, currentIndex, tracks, coverSize, onIndexChange, onTrackChange]);

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
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, handleDragEnd]);

  // Calculate cover positions - 3 visible covers with stagger effect
  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;
    const dragOffset = isDragging ? translateX / (coverSize + gap) : 0;
    const adjustedDiff = diff - dragOffset;
    
    // Only show -1, 0, 1 positions
    if (Math.abs(adjustedDiff) > 2) {
      return { opacity: 0, pointerEvents: 'none' as const, zIndex: 0 };
    }
    
    const absAdjustedDiff = Math.abs(adjustedDiff);
    
    // Vertical offset: LEFT (-1) goes UP, RIGHT (+1) goes DOWN
    // So if diff is negative (left side), we move UP (negative Y)
    // If diff is positive (right side), we move DOWN (positive Y)
    const verticalOffset = adjustedDiff * 60; // Negative for left (up), positive for right (down)
    
    // Scale: center is full, sides are smaller
    const scale = adjustedDiff === 0 ? 1 : Math.max(0.65, 1 - absAdjustedDiff * 0.35);
    
    // Opacity: center is bright, sides are dimmed
    const opacity = adjustedDiff === 0 ? 1 : Math.max(0.5, 1 - absAdjustedDiff * 0.4);
    
    // Brightness for dimming effect
    const brightness = adjustedDiff === 0 ? 1 : 0.6;
    
    // Z-index
    const zIndex = 10 - Math.floor(absAdjustedDiff);
    
    // X offset
    const xOffset = adjustedDiff * (coverSize * 0.65 + gap);
    
    return {
      transform: `translateX(${xOffset}px) translateY(${verticalOffset}px) scale(${scale})`,
      opacity,
      zIndex,
      filter: `brightness(${brightness})`,
      transition: isDragging 
        ? 'none' 
        : 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 350ms ease-out, filter 350ms ease-out',
    };
  };

  // Get track title style - moves with center cover
  const getTitleStyle = () => {
    const dragOffset = isDragging ? translateX * 0.3 : 0;
    
    return {
      transform: `translateX(${dragOffset}px)`,
      transition: isDragging ? 'none' : 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
    };
  };

  const currentTrack = tracks[currentIndex];

  return (
    <div className="relative w-full h-screen min-h-[600px] max-h-[900px] flex flex-col items-center justify-center bg-cream overflow-hidden">
      {/* Track Title - above covers, minimalist */}
      <div 
        className="absolute top-[15%] md:top-[18%] left-0 right-0 text-center z-20"
        style={getTitleStyle()}
      >
        <h1 className="text-lg md:text-xl font-light tracking-wide text-charcoal/80">
          {currentTrack?.title}
        </h1>
        <p className="text-xs md:text-sm font-light text-muted-foreground mt-1">
          {currentTrack?.format} · {currentTrack?.year}
        </p>
      </div>

      {/* Covers Container */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full flex-1 flex items-center justify-center touch-pan-x select-none',
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
            if (style.opacity === 0) return null;
            
            return (
              <div
                key={track.id}
                className="absolute gpu-accelerated"
                style={{
                  ...style,
                  width: coverSize,
                  height: coverSize,
                }}
              >
                <div className="cover-card w-full h-full rounded-2xl overflow-hidden select-none">
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

      {/* Drag indicator bar */}
      <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 z-20">
        <div 
          className={cn(
            'w-24 h-1 bg-charcoal/20 rounded-full cursor-grab',
            isDragging && 'cursor-grabbing bg-charcoal/40'
          )}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />
      </div>
    </div>
  );
});
