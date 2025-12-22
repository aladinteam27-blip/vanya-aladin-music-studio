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
  const [isMobile, setIsMobile] = useState(false);
  
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

  // Cover dimensions - Lady Gaga style: large centered cover
  const coverSize = typeof window !== 'undefined' 
    ? isMobile 
      ? Math.min(window.innerWidth * 0.75, 340) 
      : Math.min(Math.max(window.innerHeight * 0.55, 400), 560)
    : 450;

  // Linear animation for settling (no spring, no bounce) - smooth like Lady Gaga
  const animateLinear = useCallback((
    startOffset: number, 
    targetIndex: number
  ) => {
    const startTime = performance.now();
    const duration = 400; // Smooth duration
    const targetOffset = 0;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth ease-out, no bounce
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
    
    // Determine swipe direction - only after threshold
    if (isHorizontalSwipeRef.current === null) {
      const threshold = 12;
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
        if (isHorizontalSwipeRef.current) {
          setIsDragging(true);
        }
      }
    }
    
    // If vertical scroll, don't prevent default - let page scroll
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
      newOffset = newOffset * 0.12; // Light resistance at edges
    }
    
    const maxDrag = coverSize * 0.6;
    newOffset = Math.max(-maxDrag, Math.min(maxDrag, newOffset));
    
    setDragOffset(newOffset);
  }, [isMobile, currentIndex, tracks.length, coverSize]);

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
    
    const velocityThreshold = 0.18;
    const positionThreshold = coverSize * 0.2;
    
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
      const adjustedOffset = offset + direction * coverSize;
      animateLinear(adjustedOffset, targetIndex);
    } else {
      animateLinear(offset, currentIndex);
    }
    
    velocityRef.current = 0;
  }, [isMobile, isDragging, dragOffset, currentIndex, tracks.length, coverSize, animateLinear]);

  // Slider handler (touchpad/trackpad) - Desktop
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

  // Calculate cover styles - Lady Gaga style: centered active, side covers in corners
  const getCardStyle = (index: number): { style: React.CSSProperties; opacity: number; isCenter: boolean } | null => {
    const diff = index - currentIndex;
    
    let adjustedDiff = diff;
    if (isMobile) {
      const normalizedDrag = dragOffset / coverSize;
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
      // Center cover - perfectly centered, like Lady Gaga
      xOffset = adjustedDiff * coverSize * 0.8;
      yOffset = 0;
      scale = 1;
      opacity = 1;
      zIndex = 10;
    } else if (adjustedDiff < 0) {
      // Previous cover - top left corner, partially visible
      const t = 1 + adjustedDiff; // 0 to 0.5
      const baseOffset = isMobile ? coverSize * 0.85 : coverSize * 1.0;
      xOffset = -baseOffset + t * coverSize * 0.4;
      yOffset = isMobile 
        ? -coverSize * 0.55 + t * coverSize * 0.3
        : -coverSize * 0.65 + t * coverSize * 0.3;
      scale = 0.95;
      opacity = 0.6;
      zIndex = 5;
    } else {
      // Next cover - bottom right corner, partially visible
      const t = adjustedDiff - 1; // -0.5 to 0
      const baseOffset = isMobile ? coverSize * 0.85 : coverSize * 1.0;
      xOffset = baseOffset + t * coverSize * 0.4;
      yOffset = isMobile 
        ? coverSize * 0.55 + t * coverSize * 0.3
        : coverSize * 0.65 + t * coverSize * 0.3;
      scale = 0.95;
      opacity = 0.6;
      zIndex = 5;
    }
    
    // Smooth transition, no bounce
    const transition = isDragging 
      ? 'none' 
      : 'transform 0.45s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.4s ease-out';
    
    return {
      style: {
        transform: `translateX(${xOffset}px) translateY(${yOffset}px) scale(${scale})`,
        opacity,
        zIndex,
        width: coverSize,
        height: coverSize,
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
  // Full viewport height on desktop, slightly less on mobile to show music collection
  const carouselHeight = isMobile ? 'min-h-[65vh]' : 'min-h-[100vh]';

  return (
    <div className={cn("relative w-full flex flex-col bg-background overflow-hidden", carouselHeight)}>
      
      {/* Gradient overlay on left - Lady Gaga style */}
      <div 
        className="absolute top-0 left-0 z-[15] h-full w-1/4 pointer-events-none"
        style={{
          background: isMobile 
            ? 'linear-gradient(to right, hsl(40,20%,98%) 0%, hsl(40,20%,98%,0.5) 40%, transparent 100%)'
            : 'linear-gradient(to right, hsl(40,20%,98%) 0%, hsl(40,20%,98%) 25%, hsl(40,20%,98%,0.6) 60%, transparent 100%)'
        }}
      />

      {/* MOBILE: Track names above covers - horizontal scroll, centered */}
      {isMobile && (
        <div className="pt-20 pb-4 px-2 relative z-20">
          <div className="flex items-center justify-center gap-2 overflow-x-auto hide-scrollbar">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => handleTrackSelect(index)}
                className={cn(
                  'flex-shrink-0 text-xs font-medium whitespace-nowrap transition-all duration-300',
                  'px-3 py-1.5 rounded-sm',
                  index === currentIndex 
                    ? 'border border-foreground text-foreground' 
                    : 'text-foreground/30 border border-transparent'
                )}
              >
                {track.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DESKTOP: Track list on left side - vertical list like Lady Gaga */}
      {!isMobile && (
        <div className="absolute left-6 lg:left-14 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => handleTrackSelect(index)}
              className={cn(
                'text-left text-sm font-medium transition-all duration-300',
                'hover:text-foreground px-3 py-1.5',
                index === currentIndex 
                  ? 'border border-foreground text-foreground rounded-sm' 
                  : 'text-foreground/35 border border-transparent hover:text-foreground/70'
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
          className="relative w-full h-full select-none"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Covers container - perfectly centered */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: coverSize, height: coverSize }}
          >
            {tracks.map((track, index) => {
              const result = getCardStyle(index);
              if (!result) return null;
              
              const { style, isCenter, opacity } = result;
              
              return (
                <div
                  key={track.id}
                  className="absolute top-0 left-0"
                  style={style}
                >
                  <div 
                    className={cn(
                      "w-full h-full overflow-hidden select-none relative rounded-sm",
                      isCenter && "shadow-[0_25px_80px_-20px_rgba(0,0,0,0.35)]"
                    )}
                  >
                    <img
                      src={track.coverUrl}
                      alt={`Обложка альбома ${track.title} - ${track.format} ${track.year}`}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                    {/* Darken overlay for side covers */}
                    {!isCenter && (
                      <div 
                        className="absolute inset-0 bg-background/50 pointer-events-none"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slider / Touchpad control - positioned at bottom center, like Lady Gaga */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-[50%] max-w-[450px]">
        <div
          ref={sliderRef}
          className="relative h-[1px] bg-foreground/20 cursor-pointer"
          onMouseDown={handleSliderMouseDown}
        >
          {/* Progress thumb - solid white like Lady Gaga */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-[4px] bg-foreground rounded-full transition-all duration-200"
            style={{ 
              width: `${Math.max(12, 100 / tracks.length)}%`,
              left: `${sliderProgress * (1 - 1/tracks.length)}%`
            }}
          />
        </div>
      </div>
    </div>
  );
});