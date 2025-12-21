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
  
  // State
  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Hover tracking for desktop
  const [hoverProgress, setHoverProgress] = useState(0.5);
  
  // Touch/drag tracking
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const lastXRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const animationRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Cover dimensions
  const coverWidth = typeof window !== 'undefined' 
    ? Math.min(window.innerWidth * (isMobile ? 0.65 : 0.32), isMobile ? 260 : 380) 
    : 350;
  const coverHeight = coverWidth;

  // Linear animation for settling (no spring, no bounce)
  const animateLinear = useCallback((
    startOffset: number, 
    targetIndex: number
  ) => {
    const startTime = performance.now();
    const duration = 280;
    const targetOffset = 0;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const currentOffset = startOffset + (targetOffset - startOffset) * easeProgress;
      setDragOffset(currentOffset);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDragOffset(0);
        onIndexChange(targetIndex);
        if (onTrackChange) onTrackChange(tracks[targetIndex]);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [onIndexChange, onTrackChange, tracks]);

  // DESKTOP: Mouse move handler for hover-based navigation
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isMobile || isDragging) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, x / rect.width));
    setHoverProgress(progress);
  }, [isMobile, isDragging]);

  // DESKTOP: Handle hover exit with index update
  const handleMouseLeave = useCallback(() => {
    if (isMobile) return;
    
    // Calculate which index to snap to based on hover position
    const targetIndex = Math.round(hoverProgress * (tracks.length - 1));
    if (targetIndex !== currentIndex) {
      onIndexChange(targetIndex);
      if (onTrackChange) onTrackChange(tracks[targetIndex]);
    }
    setHoverProgress(0.5);
    setIsPressed(false);
  }, [isMobile, hoverProgress, tracks, currentIndex, onIndexChange, onTrackChange]);

  // DESKTOP: Press effect on hover
  const handleMouseDown = useCallback(() => {
    if (isMobile) return;
    setIsPressed(true);
  }, [isMobile]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  // MOBILE: Touch handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isMobile) return;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isHorizontalSwipeRef.current = null;
    lastXRef.current = touch.clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
  }, [isMobile]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Determine swipe direction
    if (isHorizontalSwipeRef.current === null) {
      const threshold = 10;
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
        if (isHorizontalSwipeRef.current) {
          setIsDragging(true);
        }
      }
    }
    
    if (!isHorizontalSwipeRef.current) return;
    e.preventDefault();
    
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;
    const moveDeltaX = touch.clientX - lastXRef.current;
    
    if (deltaTime > 0) {
      velocityRef.current = moveDeltaX / deltaTime;
    }
    
    lastXRef.current = touch.clientX;
    lastTimeRef.current = currentTime;
    
    // Calculate offset with edge clamping
    let newOffset = deltaX;
    const isAtStart = currentIndex === 0 && newOffset > 0;
    const isAtEnd = currentIndex === tracks.length - 1 && newOffset < 0;
    
    if (isAtStart || isAtEnd) {
      newOffset = newOffset * 0.15;
    }
    
    const maxDrag = coverWidth * 0.55;
    newOffset = Math.max(-maxDrag, Math.min(maxDrag, newOffset));
    
    setDragOffset(newOffset);
  }, [isMobile, currentIndex, tracks.length, coverWidth]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    if (!isDragging && isHorizontalSwipeRef.current !== true) {
      isHorizontalSwipeRef.current = null;
      return;
    }
    
    setIsDragging(false);
    isHorizontalSwipeRef.current = null;
    
    const velocity = velocityRef.current;
    const offset = dragOffset;
    
    const velocityThreshold = 0.2;
    const positionThreshold = coverWidth * 0.18;
    
    let targetIndex = currentIndex;
    
    if (Math.abs(velocity) > velocityThreshold) {
      if (velocity > 0 && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (velocity < 0 && currentIndex < tracks.length - 1) {
        targetIndex = currentIndex + 1;
      }
    } else if (Math.abs(offset) > positionThreshold) {
      if (offset > 0 && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (offset < 0 && currentIndex < tracks.length - 1) {
        targetIndex = currentIndex + 1;
      }
    }
    
    if (targetIndex !== currentIndex) {
      const direction = targetIndex > currentIndex ? -1 : 1;
      const adjustedOffset = offset + direction * coverWidth;
      animateLinear(adjustedOffset, targetIndex);
    } else {
      animateLinear(offset, currentIndex);
    }
    
    velocityRef.current = 0;
  }, [isMobile, isDragging, dragOffset, currentIndex, tracks.length, coverWidth, animateLinear]);

  // Slider handler (touchpad/trackpad)
  const handleSliderChange = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newIndex = Math.round(progress * (tracks.length - 1));
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      if (onTrackChange) onTrackChange(tracks[newIndex]);
    }
  }, [tracks, currentIndex, onIndexChange, onTrackChange]);

  const handleSliderMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    handleSliderChange(e.clientX);
    
    const handleMove = (ev: globalThis.MouseEvent) => handleSliderChange(ev.clientX);
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [handleSliderChange]);

  // Calculate cover styles
  const getCardStyle = (index: number): { style: React.CSSProperties; opacity: number; isCenter: boolean } | null => {
    const diff = index - currentIndex;
    
    // Desktop: use hover progress for smooth movement
    let adjustedDiff = diff;
    if (!isMobile && !isDragging) {
      const hoverIndex = hoverProgress * (tracks.length - 1);
      adjustedDiff = index - hoverIndex;
    } else if (isMobile) {
      const normalizedDrag = dragOffset / coverWidth;
      adjustedDiff = diff - normalizedDrag;
    }
    
    // Only render nearby covers
    if (diff < -1 || diff > 1) return null;
    
    let scale = 1;
    let xOffset = 0;
    let yOffset = 0;
    let opacity = 1;
    let zIndex = 5;
    
    const absAdjustedDiff = Math.abs(adjustedDiff);
    const isCenter = absAdjustedDiff < 0.5;
    
    if (absAdjustedDiff < 0.5) {
      // Center cover
      xOffset = adjustedDiff * coverWidth * 0.8;
      yOffset = 0;
      scale = isPressed ? 0.97 : 1;
      opacity = 1;
      zIndex = 10;
    } else if (adjustedDiff < 0) {
      // Previous cover - top left corner
      xOffset = -coverWidth * 0.85 + (1 + adjustedDiff) * coverWidth * 0.4;
      yOffset = -coverWidth * 0.55 + (1 + adjustedDiff) * coverWidth * 0.3;
      scale = 0.85;
      opacity = isMobile ? 0.5 : 0.7;
      zIndex = 5;
    } else {
      // Next cover - bottom right corner
      xOffset = coverWidth * 0.85 + (adjustedDiff - 1) * coverWidth * 0.4;
      yOffset = coverWidth * 0.55 + (adjustedDiff - 1) * coverWidth * 0.3;
      scale = 0.85;
      opacity = isMobile ? 0.5 : 0.7;
      zIndex = 5;
    }
    
    const transition = isDragging 
      ? 'none' 
      : 'transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.3s ease-out';
    
    return {
      style: {
        transform: `translateX(${xOffset}px) translateY(${yOffset}px) scale(${scale})`,
        opacity,
        zIndex,
        width: coverWidth,
        height: coverHeight,
        willChange: 'transform, opacity',
        transition,
      },
      opacity,
      isCenter,
    };
  };

  // Track selection handler
  const handleTrackSelect = useCallback((index: number) => {
    if (index !== currentIndex) {
      onIndexChange(index);
      if (onTrackChange) onTrackChange(tracks[index]);
    }
  }, [currentIndex, onIndexChange, onTrackChange, tracks]);

  const sliderProgress = tracks.length > 1 ? (currentIndex / (tracks.length - 1)) * 100 : 0;
  const carouselHeight = isMobile ? 'h-[52vh] min-h-[340px]' : 'h-[80vh] min-h-[520px] max-h-[750px]';

  return (
    <div className={cn("relative w-full flex flex-col bg-cream overflow-hidden", carouselHeight)}>
      
      {/* MOBILE: Track names above covers - centered horizontally */}
      {isMobile && (
        <div className="pt-20 pb-3 px-2">
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto hide-scrollbar">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => handleTrackSelect(index)}
                className={cn(
                  'flex-shrink-0 text-xs font-medium whitespace-nowrap transition-all duration-300',
                  'px-2 py-1 rounded-sm',
                  index === currentIndex 
                    ? 'border border-charcoal text-charcoal' 
                    : 'text-charcoal/30'
                )}
              >
                {track.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP: Track list on left side */}
      {!isMobile && (
        <div className="absolute left-6 lg:left-10 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => handleTrackSelect(index)}
              className={cn(
                'text-left text-sm font-medium transition-all duration-300',
                'hover:text-charcoal px-2.5 py-1',
                index === currentIndex 
                  ? 'border border-charcoal text-charcoal rounded-sm' 
                  : 'text-charcoal/35 border border-transparent'
              )}
            >
              {track.title}
            </button>
          ))}
        </div>
      )}

      {/* Main carousel area */}
      <div className="flex-1 flex items-center justify-center">
        <div
          ref={containerRef}
          className={cn(
            'relative w-full h-full select-none',
            !isMobile && 'cursor-pointer'
          )}
          style={{ touchAction: 'pan-y' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Covers container */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: coverWidth, height: coverHeight }}
          >
            {tracks.map((track, index) => {
              const result = getCardStyle(index);
              if (!result) return null;
              
              const { style, isCenter } = result;
              
              return (
                <div
                  key={track.id}
                  className="absolute top-0 left-0"
                  style={style}
                >
                  <div 
                    className={cn(
                      "w-full h-full overflow-hidden select-none",
                      "shadow-[0_16px_48px_-12px_rgba(0,0,0,0.2)]"
                    )}
                  >
                    <img
                      src={track.coverUrl}
                      alt={`Обложка трека ${track.title} - ${track.format} ${track.year}`}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </div>
                  
                  {/* Track title below cover - only for center on desktop */}
                  {!isMobile && isCenter && (
                    <div className="absolute -bottom-12 left-0 right-0 text-center transition-opacity duration-300">
                      <span className="inline-block px-3 py-1.5 text-sm font-medium text-charcoal border border-charcoal/15 rounded-sm bg-cream/90 backdrop-blur-sm">
                        {track.title}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slider / Touchpad control */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[65%] max-w-[400px]">
        <div
          ref={sliderRef}
          className="relative h-[3px] bg-charcoal/12 cursor-pointer rounded-full"
          onMouseDown={handleSliderMouseDown}
        >
          {/* Progress fill */}
          <div 
            className="absolute top-0 left-0 h-full bg-charcoal/50 rounded-full transition-all duration-200"
            style={{ width: `${sliderProgress}%` }}
          />
          {/* Thumb */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-charcoal rounded-full transition-all duration-200 hover:scale-125"
            style={{ left: `calc(${sliderProgress}% - 6px)` }}
          />
        </div>
      </div>
    </div>
  );
});
