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
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSliderDragging, setIsSliderDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [sliderProgress, setSliderProgress] = useState(0);
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

  // Update slider progress when index changes
  useEffect(() => {
    if (!isSliderDragging) {
      setSliderProgress(currentIndex / (tracks.length - 1));
    }
  }, [currentIndex, tracks.length, isSliderDragging]);

  // Cover size based on viewport
  const coverSize = typeof window !== 'undefined' 
    ? Math.min(window.innerWidth * (isMobile ? 0.7 : 0.35), isMobile ? 300 : 380) 
    : 320;

  // Handle cover drag start
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true);
    setStartX(clientX - translateX);
    lastX.current = clientX;
    lastTime.current = Date.now();
  }, [translateX]);

  // Handle cover drag move
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

  // Handle cover drag end with inertia
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = coverSize / 4;
    const velocityThreshold = 0.25;
    
    let newIndex = currentIndex;
    
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

  // Slider drag handlers
  const handleSliderStart = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    setIsSliderDragging(true);
    const rect = sliderRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setSliderProgress(progress);
  }, []);

  const handleSliderMove = useCallback((clientX: number) => {
    if (!isSliderDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setSliderProgress(progress);
  }, [isSliderDragging]);

  const handleSliderEnd = useCallback(() => {
    if (!isSliderDragging) return;
    setIsSliderDragging(false);
    const newIndex = Math.round(sliderProgress * (tracks.length - 1));
    onIndexChange(newIndex);
    if (onTrackChange) {
      onTrackChange(tracks[newIndex]);
    }
  }, [isSliderDragging, sliderProgress, tracks, onIndexChange, onTrackChange]);

  // Touch events for covers
  const onTouchStart = useCallback((e: TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse events for covers
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

  // Slider touch events
  const onSliderTouchStart = useCallback((e: TouchEvent) => {
    e.stopPropagation();
    handleSliderStart(e.touches[0].clientX);
  }, [handleSliderStart]);

  const onSliderTouchMove = useCallback((e: TouchEvent) => {
    e.stopPropagation();
    handleSliderMove(e.touches[0].clientX);
  }, [handleSliderMove]);

  const onSliderTouchEnd = useCallback((e: TouchEvent) => {
    e.stopPropagation();
    handleSliderEnd();
  }, [handleSliderEnd]);

  // Slider mouse events
  const onSliderMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSliderStart(e.clientX);
    
    const handleMouseMove = (ev: globalThis.MouseEvent) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      setSliderProgress(progress);
    };
    
    const handleMouseUp = () => {
      setIsSliderDragging(false);
      const newIndex = Math.round(sliderProgress * (tracks.length - 1));
      onIndexChange(newIndex);
      if (onTrackChange) {
        onTrackChange(tracks[newIndex]);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleSliderStart, sliderProgress, tracks, onIndexChange, onTrackChange]);

  // Calculate 3D cover positions - diagonal movement, sides show only small piece
  const getCardStyle = (index: number) => {
    const diff = index - currentIndex;
    const dragOffset = isDragging ? translateX / coverSize : 0;
    const sliderOffset = isSliderDragging 
      ? (sliderProgress * (tracks.length - 1) - currentIndex) 
      : 0;
    const adjustedDiff = diff - dragOffset - sliderOffset;
    
    // Show left (-1), center (0), right (+1)
    if (Math.abs(adjustedDiff) > 1.5) {
      return { opacity: 0, pointerEvents: 'none' as const, zIndex: 0, display: 'none' };
    }
    
    const absAdjustedDiff = Math.abs(adjustedDiff);
    const isCenter = absAdjustedDiff < 0.3;
    
    // Side covers show only small piece (offset far to sides)
    const sideOffset = coverSize * 0.75; // Most of cover is off-screen
    const diagonalX = adjustedDiff * (coverSize * 0.5 + sideOffset);
    
    // Diagonal Y: left goes up, right goes down
    const diagonalY = adjustedDiff * 40;
    
    // 3D rotation effect
    const rotateY = adjustedDiff * -20;
    const rotateZ = adjustedDiff * 2;
    
    // Scale: center is full, sides are smaller
    const scale = isCenter ? 1 : Math.max(0.7, 1 - absAdjustedDiff * 0.3);
    
    // Opacity for darkening sides
    const opacity = isCenter ? 1 : 0.5;
    
    // Brightness for dimming effect
    const brightness = isCenter ? 1 : 0.4;
    
    // Z-index
    const zIndex = 10 - Math.floor(absAdjustedDiff * 2);
    
    return {
      transform: `
        translateX(${diagonalX}px) 
        translateY(${diagonalY}px) 
        scale(${scale}) 
        rotateY(${rotateY}deg)
        rotateZ(${rotateZ}deg)
      `,
      opacity,
      zIndex,
      filter: `brightness(${brightness})`,
      transition: isDragging || isSliderDragging
        ? 'none' 
        : 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease-out, filter 400ms ease-out',
    };
  };

  // Title moves diagonally with cover
  const getTitleStyle = () => {
    const dragOffset = isDragging ? translateX * 0.5 : 0;
    const dragOffsetY = isDragging ? translateX * -0.15 : 0;
    
    return {
      transform: `translate(${dragOffset}px, ${dragOffsetY}px)`,
      transition: isDragging ? 'none' : 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)',
    };
  };

  const currentTrack = tracks[currentIndex];

  return (
    <div className="relative w-full h-screen min-h-[600px] max-h-[900px] flex flex-col items-center justify-center bg-cream overflow-hidden">
      {/* Track Title - moves diagonally with cover, minimalist */}
      <div 
        className="absolute top-[12%] md:top-[15%] left-0 right-0 text-center z-20 pointer-events-none"
        style={getTitleStyle()}
      >
        <h1 className="text-xl md:text-2xl font-semibold tracking-wide text-charcoal">
          {currentTrack?.title}
        </h1>
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
        {/* Covers - square, no rounding on main screen */}
        <div className="relative flex items-center justify-center" style={{ perspective: '1200px' }}>
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
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Square cover - no border radius */}
                <div className="w-full h-full overflow-hidden select-none shadow-2xl">
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

      {/* Slider Track (палочка) */}
      <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-20">
        <div
          ref={sliderRef}
          className={cn(
            'relative bg-charcoal/30 rounded-full cursor-pointer',
            isMobile ? 'w-32 h-1' : 'w-48 h-1'
          )}
          onTouchStart={onSliderTouchStart}
          onTouchMove={onSliderTouchMove}
          onTouchEnd={onSliderTouchEnd}
          onMouseDown={onSliderMouseDown}
        >
          {/* Progress fill */}
          <div 
            className="absolute top-0 left-0 h-full bg-charcoal rounded-full transition-none"
            style={{ width: `${sliderProgress * 100}%` }}
          />
          
          {/* Oval handle */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 bg-charcoal rounded-full shadow-lg',
              'transition-transform duration-100',
              isSliderDragging ? 'scale-110' : 'hover:scale-105',
              isMobile ? 'w-5 h-3' : 'w-6 h-3.5'
            )}
            style={{ 
              left: `calc(${sliderProgress * 100}% - ${isMobile ? 10 : 12}px)`,
            }}
          />
        </div>
      </div>
    </div>
  );
});
