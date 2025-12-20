import { 
  useState, 
  useRef, 
  useEffect, 
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

  // Cover size based on viewport
  const coverSize = typeof window !== 'undefined' 
    ? Math.min(window.innerWidth * 0.7, 320) 
    : 280;
  const gap = 20;

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

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = coverSize / 3;
    const velocityThreshold = 0.3;
    
    let newIndex = currentIndex;
    
    // Consider both position and velocity
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

  // Calculate cover positions
  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;
    const dragOffset = isDragging ? translateX / (coverSize + gap) : 0;
    const adjustedDiff = diff - dragOffset;
    
    // Calculate vertical offset for staggered effect
    const absAdjustedDiff = Math.abs(adjustedDiff);
    const verticalOffset = Math.min(absAdjustedDiff * 15, 40);
    const yDirection = adjustedDiff > 0 ? 1 : -1;
    
    // Scale based on distance from center
    const scale = Math.max(0.75, 1 - absAdjustedDiff * 0.12);
    
    // Opacity based on distance
    const opacity = Math.max(0.4, 1 - absAdjustedDiff * 0.25);
    
    // Z-index
    const zIndex = 10 - Math.floor(absAdjustedDiff);
    
    // X offset
    const xOffset = adjustedDiff * (coverSize + gap);
    
    return {
      transform: `translateX(${xOffset}px) translateY(${verticalOffset * yDirection}px) scale(${scale})`,
      opacity,
      zIndex,
      transition: isDragging 
        ? 'none' 
        : 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease-out',
    };
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-[400px] md:h-[480px] flex items-center justify-center overflow-hidden touch-pan-x',
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
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="absolute gpu-accelerated"
            style={{
              ...getCardStyle(index),
              width: coverSize,
              height: coverSize,
            }}
          >
            <div 
              className="cover-card w-full h-full rounded-2xl overflow-hidden shadow-cover select-none"
            >
              <img
                src={track.coverUrl}
                alt={track.title}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
