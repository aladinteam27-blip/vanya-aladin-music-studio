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
  const [isPressed, setIsPressed] = useState(false);
  
  // Physics state
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
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
    ? Math.min(window.innerWidth * (isMobile ? 0.8 : 0.4), isMobile ? 350 : 520) 
    : 400;
  const coverHeight = coverWidth;

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Spring animation for settling
  const animateSpring = useCallback((
    startOffset: number, 
    targetIndex: number, 
    initialVelocity: number
  ) => {
    const startTime = performance.now();
    const duration = 500; // ms
    const targetOffset = 0;
    
    // Spring parameters
    const damping = 0.7;
    const frequency = 3;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Spring easing with overshoot
      const springProgress = 1 - Math.exp(-frequency * progress) * 
        Math.cos(2 * Math.PI * frequency * progress * (1 - damping));
      
      const currentOffset = startOffset + (targetOffset - startOffset) * springProgress;
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
  const handleDragStart = useCallback((clientX: number) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setIsDragging(true);
    setIsPressed(true);
    lastXRef.current = clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
  }, []);

  // Handle drag move with velocity tracking
  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;
    const deltaX = clientX - lastXRef.current;
    
    // Track velocity for momentum
    if (deltaTime > 0) {
      // Smooth velocity with exponential moving average
      const newVelocity = deltaX / deltaTime;
      velocityRef.current = velocityRef.current * 0.7 + newVelocity * 0.3;
    }
    
    lastXRef.current = clientX;
    lastTimeRef.current = currentTime;
    
    // Calculate new offset with rubber band effect at edges
    let newOffset = dragOffset + deltaX;
    
    // Rubber band resistance at edges
    const isAtStart = currentIndex === 0 && newOffset > 0;
    const isAtEnd = currentIndex === tracks.length - 1 && newOffset < 0;
    
    if (isAtStart || isAtEnd) {
      // Apply resistance - harder to pull at edges
      const resistance = 0.3;
      newOffset = dragOffset + deltaX * resistance;
    }
    
    // Clamp maximum drag
    const maxDrag = coverWidth * 0.7;
    newOffset = Math.max(-maxDrag, Math.min(maxDrag, newOffset));
    
    setDragOffset(newOffset);
  }, [isDragging, dragOffset, currentIndex, tracks.length, coverWidth]);

  // Handle drag end with momentum
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsPressed(false);
    
    const velocity = velocityRef.current;
    const offset = dragOffset;
    
    // Determine target based on velocity and position
    const velocityThreshold = 0.3;
    const positionThreshold = coverWidth * 0.15;
    
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
    
    // If target changed, animate to new position with adjusted offset
    if (targetIndex !== currentIndex) {
      const direction = targetIndex > currentIndex ? -1 : 1;
      const adjustedOffset = offset + direction * coverWidth;
      animateSpring(adjustedOffset, targetIndex, velocity);
    } else {
      // Snap back with spring
      animateSpring(offset, currentIndex, velocity);
    }
    
    velocityRef.current = 0;
  }, [isDragging, dragOffset, currentIndex, tracks.length, coverWidth, animateSpring]);

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

  // Calculate cover styles with tactile physics
  const getCardStyle = (index: number): React.CSSProperties | null => {
    const diff = index - currentIndex;
    const normalizedDrag = dragOffset / coverWidth;
    const adjustedDiff = diff - normalizedDrag;
    
    // Only render visible covers
    if (adjustedDiff < -0.8 || adjustedDiff > 1.8) {
      return null;
    }
    
    const absAdjustedDiff = Math.abs(adjustedDiff);
    const isCenter = absAdjustedDiff < 0.25;
    
    // Tactile scale response - slight shrink when pressed/dragging center
    let scale = 1;
    let xOffset = 0;
    let yOffset = 0;
    let opacity = 1;
    let rotateY = 0;
    
    if (isCenter) {
      // Center cover
      xOffset = adjustedDiff * coverWidth * 1.1;
      scale = isPressed ? 0.98 : 1; // Tactile press feedback
      opacity = 1;
      // Subtle 3D tilt based on drag direction
      rotateY = normalizedDrag * -8;
    } else {
      // Next/side cover
      const baseX = coverWidth * 0.85;
      xOffset = baseX + (adjustedDiff - 1) * coverWidth * 1.1;
      yOffset = isMobile ? 180 : 220;
      scale = 0.88;
      opacity = 0.75;
      rotateY = -5;
    }
    
    const zIndex = isCenter ? 10 : 5;
    
    // Dynamic transition based on interaction state
    const transition = isDragging 
      ? 'none' 
      : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out';
    
    return {
      transform: `
        translateX(${xOffset}px) 
        translateY(${yOffset}px) 
        scale(${scale})
        rotateY(${rotateY}deg)
        perspective(1200px)
      `,
      opacity,
      zIndex,
      width: coverWidth,
      height: coverHeight,
      willChange: 'transform, opacity',
      transition,
      transformStyle: 'preserve-3d' as const,
    };
  };

  const progressPercent = tracks.length > 1 ? (currentIndex / (tracks.length - 1)) * 100 : 0;

  const handleTrackSelect = (index: number) => {
    if (index !== currentIndex) {
      onIndexChange(index);
      if (onTrackChange) onTrackChange(tracks[index]);
    }
  };

  return (
    <div className="relative w-full h-screen min-h-[650px] max-h-[950px] flex flex-col bg-cream overflow-hidden">
      
      {/* Mobile: Horizontal track tabs */}
      {isMobile && (
        <div className="pt-20 pb-4 px-4">
          <div 
            ref={tabsRef}
            className="flex gap-3 overflow-x-auto hide-scrollbar"
          >
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => handleTrackSelect(index)}
                className={cn(
                  'flex-shrink-0 text-sm font-medium whitespace-nowrap transition-all duration-300',
                  'px-3 py-1.5 rounded-sm active:scale-95',
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
      <div className={cn("flex-1 flex items-center justify-center", isMobile ? "pt-4" : "pt-16")}>
        <div
          ref={containerRef}
          className={cn(
            'relative w-full h-full touch-pan-x select-none',
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
              const style = getCardStyle(index);
              if (!style) return null;
              
              return (
                <div
                  key={track.id}
                  className="absolute top-0 left-0"
                  style={style}
                >
                  <div 
                    className={cn(
                      "w-full h-full overflow-hidden select-none",
                      "transition-shadow duration-300",
                      isPressed && index === currentIndex 
                        ? "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]"
                        : "shadow-[0_30px_90px_-25px_rgba(0,0,0,0.25)]"
                    )}
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

      {/* Progress bar */}
      <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-20 w-[75%] max-w-[550px]">
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
              transition: isDragging ? 'none' : 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </div>
      </div>
    </div>
  );
});
