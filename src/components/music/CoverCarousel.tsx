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
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Touch tracking for distinguishing horizontal vs vertical swipe
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  
  // Velocity tracking
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (isMobile && tabsRef.current) {
      const activeTab = tabsRef.current.children[currentIndex] as HTMLElement;
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentIndex, isMobile]);

  // Cover dimensions
  const coverWidth = typeof window !== 'undefined' 
    ? Math.min(window.innerWidth * (isMobile ? 0.7 : 0.35), isMobile ? 280 : 420) 
    : 350;
  const coverHeight = coverWidth;

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Linear animation for settling (no spring)
  const animateLinear = useCallback((
    startOffset: number, 
    targetIndex: number
  ) => {
    const startTime = performance.now();
    const duration = 300; // ms - faster, direct
    const targetOffset = 0;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic - direct, no overshoot
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

  // Handle drag start
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    touchStartRef.current = { x: clientX, y: clientY };
    isHorizontalSwipeRef.current = null;
    lastXRef.current = clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
  }, []);

  // Handle drag move with direction detection
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    const deltaX = clientX - touchStartRef.current.x;
    const deltaY = clientY - touchStartRef.current.y;
    
    // Determine swipe direction on first significant movement
    if (isHorizontalSwipeRef.current === null) {
      const threshold = 10;
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        // If vertical movement is greater, allow page scroll
        isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY);
        if (isHorizontalSwipeRef.current) {
          setIsDragging(true);
        }
      }
    }
    
    // Only handle horizontal swipe
    if (!isHorizontalSwipeRef.current) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;
    const moveDeltaX = clientX - lastXRef.current;
    
    // Track velocity
    if (deltaTime > 0) {
      velocityRef.current = moveDeltaX / deltaTime;
    }
    
    lastXRef.current = clientX;
    lastTimeRef.current = currentTime;
    
    // Calculate new offset
    let newOffset = deltaX;
    
    // Clamp at edges without rubber band
    const isAtStart = currentIndex === 0 && newOffset > 0;
    const isAtEnd = currentIndex === tracks.length - 1 && newOffset < 0;
    
    if (isAtStart) {
      newOffset = Math.min(newOffset * 0.2, coverWidth * 0.15);
    } else if (isAtEnd) {
      newOffset = Math.max(newOffset * 0.2, -coverWidth * 0.15);
    }
    
    // Clamp maximum drag
    const maxDrag = coverWidth * 0.6;
    newOffset = Math.max(-maxDrag, Math.min(maxDrag, newOffset));
    
    setDragOffset(newOffset);
  }, [currentIndex, tracks.length, coverWidth]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging && isHorizontalSwipeRef.current !== true) {
      isHorizontalSwipeRef.current = null;
      return;
    }
    
    setIsDragging(false);
    isHorizontalSwipeRef.current = null;
    
    const velocity = velocityRef.current;
    const offset = dragOffset;
    
    // Determine target based on velocity and position
    const velocityThreshold = 0.25;
    const positionThreshold = coverWidth * 0.2;
    
    let targetIndex = currentIndex;
    
    // High velocity flick
    if (Math.abs(velocity) > velocityThreshold) {
      if (velocity > 0 && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (velocity < 0 && currentIndex < tracks.length - 1) {
        targetIndex = currentIndex + 1;
      }
    } 
    // Position-based
    else if (Math.abs(offset) > positionThreshold) {
      if (offset > 0 && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      } else if (offset < 0 && currentIndex < tracks.length - 1) {
        targetIndex = currentIndex + 1;
      }
    }
    
    // Animate to target position
    if (targetIndex !== currentIndex) {
      const direction = targetIndex > currentIndex ? -1 : 1;
      const adjustedOffset = offset + direction * coverWidth;
      animateLinear(adjustedOffset, targetIndex);
    } else {
      animateLinear(offset, currentIndex);
    }
    
    velocityRef.current = 0;
  }, [isDragging, dragOffset, currentIndex, tracks.length, coverWidth, animateLinear]);

  // Progress bar click
  const handleProgressClick = useCallback((clientX: number) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newIndex = Math.round(progress * (tracks.length - 1));
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      if (onTrackChange) onTrackChange(tracks[newIndex]);
    }
  }, [tracks, currentIndex, onIndexChange, onTrackChange]);

  // Touch events - don't prevent default to allow vertical scroll
  const onTouchStart = useCallback((e: TouchEvent) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    // Only prevent default if we're doing horizontal swipe
    if (isHorizontalSwipeRef.current === true) {
      e.preventDefault();
    }
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse events
  const onMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
    setIsDragging(true);
    isHorizontalSwipeRef.current = true;
  }, [handleDragStart]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleDragMove(e.clientX, e.clientY);
  }, [isDragging, handleDragMove]);

  const onMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const onMouseLeave = useCallback(() => {
    if (isDragging) handleDragEnd();
  }, [isDragging, handleDragEnd]);

  // Progress mouse handler
  const onProgressMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleProgressClick(e.clientX);
    
    const handleMove = (ev: globalThis.MouseEvent) => handleProgressClick(ev.clientX);
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [handleProgressClick]);

  // Calculate cover styles with diagonal movement
  const getCardStyle = (index: number): { style: React.CSSProperties; titleOpacity: number } | null => {
    const diff = index - currentIndex;
    const normalizedDrag = dragOffset / coverWidth;
    const adjustedDiff = diff - normalizedDrag;
    
    // Render visible covers: prev, current, next
    if (diff < -1 || diff > 1) {
      return null;
    }
    
    const absAdjustedDiff = Math.abs(adjustedDiff);
    
    let scale = 1;
    let xOffset = 0;
    let yOffset = 0;
    let opacity = 1;
    let rotateY = 0;
    let titleOpacity = 1;
    
    if (diff === 0) {
      // Center cover - moves diagonally to top-left when swiping left
      xOffset = adjustedDiff * coverWidth * 1.2;
      yOffset = Math.min(0, adjustedDiff * coverWidth * 0.3); // Only move up when going left
      scale = 1 - Math.abs(adjustedDiff) * 0.12;
      opacity = 1;
      rotateY = normalizedDrag * -8;
      titleOpacity = 1 - Math.abs(adjustedDiff) * 0.8;
    } else if (diff === -1) {
      // Previous cover - top-left corner, partially visible
      const baseX = -coverWidth * 0.7;
      const baseY = -coverWidth * 0.5;
      xOffset = baseX + (1 + adjustedDiff) * coverWidth * 0.5;
      yOffset = baseY + (1 + adjustedDiff) * coverWidth * 0.3;
      scale = 0.75 + (1 + adjustedDiff) * 0.25;
      opacity = 0.6 + (1 + adjustedDiff) * 0.4;
      rotateY = 8 - (1 + adjustedDiff) * 8;
      titleOpacity = 0.3;
    } else if (diff === 1) {
      // Next cover - bottom-right corner, partially visible
      const baseX = coverWidth * 0.7;
      const baseY = coverWidth * 0.5;
      xOffset = baseX + (adjustedDiff - 1) * coverWidth * 0.5;
      yOffset = baseY + (adjustedDiff - 1) * coverWidth * 0.3;
      scale = 0.75 + (1 - adjustedDiff) * 0.25;
      opacity = 0.6 + (1 - adjustedDiff) * 0.4;
      rotateY = -8 + (1 - adjustedDiff) * 8;
      titleOpacity = 0.3;
    }
    
    const zIndex = diff === 0 ? 10 : 5;
    
    // Direct transition, no spring
    const transition = isDragging 
      ? 'none' 
      : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.3s ease-out';
    
    return {
      style: {
        transform: `
          translateX(${xOffset}px) 
          translateY(${yOffset}px) 
          scale(${scale})
          rotateY(${rotateY}deg)
        `,
        opacity,
        zIndex,
        width: coverWidth,
        height: coverHeight,
        willChange: 'transform, opacity',
        transition,
        transformStyle: 'preserve-3d' as const,
      },
      titleOpacity,
    };
  };

  const progressPercent = tracks.length > 1 ? (currentIndex / (tracks.length - 1)) * 100 : 0;

  const handleTrackSelect = (index: number) => {
    if (index !== currentIndex) {
      onIndexChange(index);
      if (onTrackChange) onTrackChange(tracks[index]);
    }
  };

  // Carousel height - shorter on mobile to show collection below
  const carouselHeight = isMobile ? 'h-[55vh] min-h-[380px]' : 'h-[75vh] min-h-[550px] max-h-[800px]';

  return (
    <div className={cn("relative w-full flex flex-col bg-cream overflow-hidden", carouselHeight)}>
      
      {/* Mobile: Horizontal track tabs */}
      {isMobile && (
        <div className="pt-20 pb-3 px-4">
          <div 
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto hide-scrollbar"
          >
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => handleTrackSelect(index)}
                className={cn(
                  'flex-shrink-0 text-xs font-medium whitespace-nowrap transition-all duration-300',
                  'px-2.5 py-1 rounded-sm active:scale-95',
                  index === currentIndex 
                    ? 'border border-charcoal text-charcoal' 
                    : 'text-charcoal/40 hover:text-charcoal/70'
                )}
              >
                {track.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop: Left sidebar */}
      {!isMobile && (
        <div className="absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => handleTrackSelect(index)}
              className={cn(
                'text-left text-sm font-medium transition-all duration-300',
                'hover:text-charcoal px-2 py-0.5 active:scale-95',
                index === currentIndex 
                  ? 'border border-charcoal text-charcoal' 
                  : 'text-charcoal/40'
              )}
            >
              {track.title}
            </button>
          ))}
        </div>
      )}

      {/* Main carousel */}
      <div className="flex-1 flex items-center justify-center">
        <div
          ref={containerRef}
          className={cn(
            'relative w-full h-full select-none',
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
          style={{ touchAction: 'pan-y' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {/* Covers container */}
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ 
              width: coverWidth, 
              height: coverHeight,
              perspective: '1200px',
            }}
          >
            {tracks.map((track, index) => {
              const result = getCardStyle(index);
              if (!result) return null;
              
              const { style, titleOpacity } = result;
              
              return (
                <div
                  key={track.id}
                  className="absolute top-0 left-0"
                  style={style}
                >
                  <div 
                    className={cn(
                      "w-full h-full overflow-hidden select-none",
                      "shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)]"
                    )}
                  >
                    <img
                      src={track.coverUrl}
                      alt={`Обложка трека ${track.title} - ${track.format} ${track.year}`}
                      className="w-full h-full object-cover pointer-events-none"
                      draggable={false}
                    />
                  </div>
                  
                  {/* Track title below cover */}
                  <div 
                    className="absolute -bottom-10 left-0 right-0 text-center transition-opacity duration-300"
                    style={{ opacity: titleOpacity }}
                  >
                    <span className="inline-block px-3 py-1 text-sm font-medium text-charcoal border border-charcoal/20 rounded-sm bg-cream/80 backdrop-blur-sm">
                      {track.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[70%] max-w-[450px]">
        <div
          ref={progressRef}
          className="relative h-[2px] bg-charcoal/15 cursor-pointer"
          onMouseDown={onProgressMouseDown}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleProgressClick(e.touches[0].clientX);
          }}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-charcoal/70"
            style={{ 
              width: `${Math.max(progressPercent, 2)}%`,
              transition: isDragging ? 'none' : 'width 0.3s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  );
});