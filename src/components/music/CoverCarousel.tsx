import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, useSpring, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Track } from '@/data/tracks';
import { cn } from '@/lib/utils';

interface CoverCarouselProps {
  tracks: Track[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onTrackChange?: (track: Track) => void;
}

// Spring config - viscous, expensive like Lady Gaga site
const springConfig = { stiffness: 100, damping: 30 };
const snapSpring = { stiffness: 300, damping: 35 };

export const CoverCarousel = memo(function CoverCarousel({
  tracks,
  currentIndex,
  onIndexChange,
  onTrackChange,
}: CoverCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Motion values for mouse tracking (Desktop)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring values for smooth canvas floating movement - entire scene follows mouse
  const sceneX = useSpring(0, springConfig);
  const sceneY = useSpring(0, springConfig);
  
  // 3D rotation for center cover on hover
  const rotateY = useSpring(0, springConfig);
  const rotateX = useSpring(0, springConfig);
  
  // Mobile drag offset for vertical drum
  const dragOffset = useMotionValue(0);
  const textDrumOffset = useSpring(0, snapSpring);

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Stagger entrance animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  // Desktop: Mouse move handler - scene follows cursor (inverted, like camera)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile || isDragging) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalize mouse position to -1...1
    const normalizedX = (e.clientX - rect.left - centerX) / centerX;
    const normalizedY = (e.clientY - rect.top - centerY) / centerY;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);

    // Move entire scene in opposite direction (camera effect) - expansive movement
    sceneX.set(-normalizedX * 180);
    sceneY.set(-normalizedY * 140);

    // 3D tilt effect for center cover - subtle but noticeable
    rotateY.set(-normalizedX * 15);
    rotateX.set(normalizedY * 10);
  }, [isMobile, isDragging, mouseX, mouseY, sceneX, sceneY, rotateY, rotateX]);

  // Reset scene position on mouse leave
  const handleMouseLeave = useCallback(() => {
    sceneX.set(0);
    sceneY.set(0);
    rotateY.set(0);
    rotateX.set(0);
  }, [sceneX, sceneY, rotateY, rotateX]);

  // Handle track selection
  const handleTrackClick = useCallback((index: number) => {
    onIndexChange(index);
    onTrackChange?.(tracks[index]);
  }, [tracks, onIndexChange, onTrackChange]);

  // Mobile: Drag handlers for vertical drum
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDrag = useCallback((_: any, info: { offset: { y: number } }) => {
    dragOffset.set(info.offset.y);
    textDrumOffset.set(info.offset.y);
  }, [dragOffset, textDrumOffset]);

  const handleDragEnd = useCallback((_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    setIsDragging(false);
    
    const threshold = 60;
    const velocityThreshold = 500;
    let newIndex = currentIndex;

    // Determine direction based on offset or velocity
    if (Math.abs(info.offset.y) > threshold || Math.abs(info.velocity.y) > velocityThreshold) {
      if (info.offset.y > 0 || info.velocity.y > velocityThreshold) {
        // Swiped down = previous track
        newIndex = Math.max(0, currentIndex - 1);
      } else {
        // Swiped up = next track
        newIndex = Math.min(tracks.length - 1, currentIndex + 1);
      }
    }

    // Snap back animation
    animate(dragOffset, 0, snapSpring);
    animate(textDrumOffset, 0, snapSpring);
    
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      onTrackChange?.(tracks[newIndex]);
    }
  }, [currentIndex, tracks, dragOffset, textDrumOffset, onIndexChange, onTrackChange]);

  // Slider handler
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newIndex = Math.round(value * (tracks.length - 1));
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      onTrackChange?.(tracks[newIndex]);
    }
  }, [tracks, currentIndex, onIndexChange, onTrackChange]);

  // Calculate cover styles based on position - true 3D diagonal
  const getCoverStyle = useCallback((index: number) => {
    const diff = index - currentIndex;
    const absPos = Math.abs(diff);
    
    // Cover size
    const size = isMobile ? 220 : 380;
    
    // Diagonal positioning:
    // Previous covers (diff < 0) → upper-left direction
    // Next covers (diff > 0) → lower-right direction
    const diagonalSpread = isMobile ? 160 : 320;
    const zDepth = isMobile ? 180 : 300;
    
    return {
      size,
      // Z-index hierarchy: center on top, others recede
      zIndex: 50 - absPos * 10,
      // Opacity: center is brightest
      opacity: diff === 0 ? 1 : Math.max(0.25, 0.65 - absPos * 0.2),
      // Scale: center is largest
      scale: diff === 0 ? 1 : Math.max(0.45, 0.75 - absPos * 0.12),
      // Diagonal offset
      offsetX: diff * diagonalSpread * (isMobile ? 0.3 : 1),
      offsetY: diff * diagonalSpread,
      // Z-depth: center at front, others recede into depth
      translateZ: diff === 0 ? 100 : -absPos * zDepth,
      isCenter: diff === 0,
      diff,
      absPos,
    };
  }, [currentIndex, isMobile]);

  // Interpolated drag transform for mobile covers
  const mobileDragTransform = useTransform(dragOffset, (y) => y * 0.5);

  // Text drum offset for mobile
  const textDrumTransform = useTransform(textDrumOffset, (y) => y * 0.7);

  // Desktop cover size
  const coverSize = isMobile ? 220 : 380;

  return (
    <section
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-background"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Desktop: Track names sidebar - left aligned */}
      {!isMobile && (
        <nav className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-0.5">
          {tracks.map((track, index) => {
            const isActive = index === currentIndex;
            return (
              <motion.button
                key={track.id}
                onClick={() => handleTrackClick(index)}
                className={cn(
                  'text-left px-4 py-2 text-sm font-medium transition-colors duration-300',
                  isActive
                    ? 'text-foreground border border-foreground/40'
                    : 'text-foreground/30 hover:text-foreground/60 border border-transparent'
                )}
                animate={{
                  opacity: isActive ? 1 : 0.5,
                }}
                transition={{ duration: 0.3 }}
              >
                {track.title}
              </motion.button>
            );
          })}
        </nav>
      )}

      {/* Mobile: Vertical drum text - synchronized with covers */}
      {isMobile && (
        <motion.div 
          className="absolute left-0 right-0 top-20 z-[60] flex flex-col items-center justify-center pointer-events-none"
          style={{ y: textDrumTransform }}
        >
          {tracks.map((track, index) => {
            const diff = index - currentIndex;
            const isActive = diff === 0;
            const opacity = isActive ? 1 : Math.max(0.15, 0.4 - Math.abs(diff) * 0.12);
            const scale = isActive ? 1 : 0.7;
            const blur = isActive ? 0 : Math.min(4, Math.abs(diff) * 2);
            
            return (
              <motion.button
                key={track.id}
                onClick={() => handleTrackClick(index)}
                className={cn(
                  'px-5 py-2.5 text-base font-semibold whitespace-nowrap pointer-events-auto',
                  isActive
                    ? 'text-foreground border border-foreground/50'
                    : 'text-foreground/25 border border-transparent'
                )}
                animate={{
                  y: -currentIndex * 48,
                  opacity,
                  scale,
                  filter: `blur(${blur}px)`,
                }}
                transition={{ type: 'spring', ...springConfig }}
              >
                {track.title}
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* 3D Scene Container with perspective */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          perspective: '1200px',
          perspectiveOrigin: 'center center',
        }}
      >
        {/* Floating scene that follows mouse (desktop) or drag (mobile) */}
        <motion.div
          className="relative"
          style={{
            width: isMobile ? '100vw' : '200vw',
            height: isMobile ? '100vh' : '150vh',
            transformStyle: 'preserve-3d',
            x: isMobile ? 0 : sceneX,
            y: isMobile ? mobileDragTransform : sceneY,
          }}
          drag={isMobile ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.12}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          {/* All covers in scene */}
          <AnimatePresence mode="sync">
            {tracks.map((track, index) => {
              const style = getCoverStyle(index);
              const entranceDelay = index * 0.08;

              return (
                <motion.div
                  key={track.id}
                  className={cn(
                    'absolute cursor-pointer',
                    style.isCenter && 'cursor-default'
                  )}
                  style={{
                    width: style.size,
                    height: style.size,
                    left: '50%',
                    top: '50%',
                    marginLeft: -style.size / 2,
                    marginTop: -style.size / 2,
                    zIndex: style.zIndex,
                    transformStyle: 'preserve-3d',
                  }}
                  initial={isLoaded ? false : { 
                    opacity: 0, 
                    scale: 0.5, 
                    z: -500,
                    x: style.offsetX,
                    y: style.offsetY,
                  }}
                  animate={{
                    x: style.offsetX,
                    y: style.offsetY,
                    z: style.translateZ,
                    scale: style.isCenter && isPressed ? 0.92 : style.scale,
                    opacity: style.opacity,
                  }}
                  transition={{ 
                    type: 'spring', 
                    ...springConfig,
                    delay: isLoaded ? 0 : entranceDelay,
                  }}
                  onClick={() => !style.isCenter && handleTrackClick(index)}
                  onMouseDown={() => style.isCenter && setIsPressed(true)}
                  onMouseUp={() => setIsPressed(false)}
                  onMouseLeave={() => setIsPressed(false)}
                >
                  {/* 3D rotation wrapper for center cover tilt */}
                  <motion.div
                    className="w-full h-full relative"
                    style={{
                      transformStyle: 'preserve-3d',
                      rotateY: style.isCenter && !isMobile ? rotateY : 0,
                      rotateX: style.isCenter && !isMobile ? rotateX : 0,
                    }}
                  >
                    {/* Real box-shadow for depth - different for center vs others */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        boxShadow: style.isCenter
                          ? '0 60px 120px -30px rgba(0,0,0,0.6), 0 40px 80px -30px rgba(0,0,0,0.5)'
                          : style.diff < 0
                            // Upper-left covers cast shadow to lower-right
                            ? '20px 20px 60px rgba(0,0,0,0.4), 10px 10px 30px rgba(0,0,0,0.3)'
                            // Lower-right covers cast shadow
                            : '-10px 50px 100px rgba(0,0,0,0.45)',
                      }}
                    />

                    {/* Cover image */}
                    <img
                      src={track.coverUrl}
                      alt={`${track.title} - ${track.format} ${track.year}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                      style={{ aspectRatio: '1/1' }}
                    />

                    {/* Darkening overlay for non-center covers */}
                    {!style.isCenter && (
                      <div 
                        className="absolute inset-0 pointer-events-none bg-foreground/30"
                        style={{ 
                          opacity: 0.3 + style.absPos * 0.15,
                        }}
                      />
                    )}

                    {/* Border frame for center cover */}
                    {style.isCenter && (
                      <div 
                        className="absolute inset-0 pointer-events-none border border-foreground/10"
                      />
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Bottom progress indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] w-[260px] md:w-[360px]">
        {/* Progress bar */}
        <div className="relative h-[2px] bg-foreground/15 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            animate={{
              width: `${((currentIndex + 1) / tracks.length) * 100}%`,
            }}
            transition={{ type: 'spring', ...snapSpring }}
          />
        </div>
        
        {/* Invisible range input for scrubbing */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={currentIndex / Math.max(1, tracks.length - 1)}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-10 -mt-4 opacity-0 cursor-pointer"
          style={{ touchAction: 'none' }}
        />

        {/* Track counter */}
        <p className="text-center text-xs text-foreground/40 mt-4 font-medium tracking-wide">
          {currentIndex + 1} / {tracks.length}
        </p>
      </div>
    </section>
  );
});
