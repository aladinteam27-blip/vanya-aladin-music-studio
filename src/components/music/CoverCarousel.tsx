import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, useSpring, useMotionValue, useTransform, animate } from 'framer-motion';
import { Track } from '@/data/tracks';
import { cn } from '@/lib/utils';

interface CoverCarouselProps {
  tracks: Track[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onTrackChange?: (track: Track) => void;
}

// Spring config - viscous, expensive like Lady Gaga
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

  // Motion values for mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring values for smooth canvas floating movement
  const canvasX = useSpring(0, springConfig);
  const canvasY = useSpring(0, springConfig);
  
  // 3D rotation for center cover
  const rotateY = useSpring(0, springConfig);
  const rotateX = useSpring(0, springConfig);
  
  // Mobile drag offset
  const dragY = useMotionValue(0);
  const textDragY = useSpring(0, snapSpring);

  // Check mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mouse move - canvas follows cursor (inverted) with floating effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile || isDragging) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalize to -1 to 1
    const normalizedX = (e.clientX - rect.left - centerX) / centerX;
    const normalizedY = (e.clientY - rect.top - centerY) / centerY;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);

    // Move canvas in opposite direction (inverted movement) - floating effect
    canvasX.set(-normalizedX * 120);
    canvasY.set(-normalizedY * 100);

    // 3D tilt effect for center cover
    rotateY.set(-normalizedX * 12);
    rotateX.set(normalizedY * 8);
  }, [isMobile, isDragging, mouseX, mouseY, canvasX, canvasY, rotateY, rotateX]);

  // Reset on mouse leave
  const handleMouseLeave = useCallback(() => {
    canvasX.set(0);
    canvasY.set(0);
    rotateY.set(0);
    rotateX.set(0);
  }, [canvasX, canvasY, rotateY, rotateX]);

  // Handle track selection
  const handleTrackClick = useCallback((index: number) => {
    onIndexChange(index);
    onTrackChange?.(tracks[index]);
  }, [tracks, onIndexChange, onTrackChange]);

  // Mobile drag handlers - vertical swipe for 3D diagonal
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDrag = useCallback((_: any, info: { offset: { y: number } }) => {
    dragY.set(info.offset.y);
    textDragY.set(info.offset.y);
  }, [dragY, textDragY]);

  const handleDragEnd = useCallback((_: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    setIsDragging(false);
    
    const threshold = 50;
    const velocityThreshold = 400;
    let newIndex = currentIndex;

    if (Math.abs(info.offset.y) > threshold || Math.abs(info.velocity.y) > velocityThreshold) {
      if (info.offset.y > 0 || info.velocity.y > velocityThreshold) {
        newIndex = Math.max(0, currentIndex - 1);
      } else {
        newIndex = Math.min(tracks.length - 1, currentIndex + 1);
      }
    }

    // Snap animation
    animate(dragY, 0, snapSpring);
    animate(textDragY, 0, snapSpring);
    
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      onTrackChange?.(tracks[newIndex]);
    }
  }, [currentIndex, tracks, dragY, textDragY, onIndexChange, onTrackChange]);

  // Slider handler
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newIndex = Math.round(value * (tracks.length - 1));
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      onTrackChange?.(tracks[newIndex]);
    }
  }, [tracks, currentIndex, onIndexChange, onTrackChange]);

  // Cover styles based on position - true 3D diagonal
  const getCoverStyle = useCallback((index: number) => {
    const diff = index - currentIndex;
    const absPos = Math.abs(diff);
    
    // Diagonal positioning:
    // Previous covers (diff < 0) → upper-left, ON TOP
    // Next covers (diff > 0) → lower-right, BELOW
    const diagonalSpread = isMobile ? 180 : 380;
    const zDepth = isMobile ? 150 : 280; // translateZ depth
    
    return {
      // Z-index: prev covers on top, next covers below
      zIndex: diff === 0 ? 30 : (diff < 0 ? 25 + diff : 15 - diff),
      // Opacity: center bright, others fade
      opacity: diff === 0 ? 1 : Math.max(0.3, 0.7 - absPos * 0.25),
      // Scale: center full, others shrink
      scale: diff === 0 ? 1 : Math.max(0.5, 0.8 - absPos * 0.15),
      // Position: diagonal spread
      offsetX: isMobile ? diff * 60 : diff * diagonalSpread,
      offsetY: diff * diagonalSpread,
      // Z depth: center at front, others recede
      translateZ: diff === 0 ? 0 : -absPos * zDepth,
      isCenter: diff === 0,
      diff,
    };
  }, [currentIndex, isMobile]);

  // Interpolated drag transform for mobile
  const mobileDragOffset = useTransform(dragY, (y) => y * 0.4);

  // Text drum offset for mobile
  const textOffset = useTransform(textDragY, (y) => y * 0.6);

  const coverSize = isMobile ? 240 : 400;

  return (
    <section
      ref={containerRef}
      className="relative w-screen h-screen overflow-visible bg-background"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Desktop: Track names sidebar */}
      {!isMobile && (
        <nav className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1">
          {tracks.map((track, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={track.id}
                onClick={() => handleTrackClick(index)}
                className={cn(
                  'text-left px-3 py-1.5 text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'text-foreground border border-foreground/30 rounded'
                    : 'text-foreground/40 hover:text-foreground/70 border border-transparent'
                )}
              >
                {track.title}
              </button>
            );
          })}
        </nav>
      )}

      {/* Mobile: Vertical drum text - synchronized with covers */}
      {isMobile && (
        <motion.div 
          className="absolute left-0 right-0 top-20 z-50 flex flex-col items-center justify-center overflow-visible"
          style={{ y: textOffset }}
        >
          {tracks.map((track, index) => {
            const diff = index - currentIndex;
            const isActive = diff === 0;
            const opacity = isActive ? 1 : Math.max(0.15, 0.4 - Math.abs(diff) * 0.15);
            const scale = isActive ? 1 : 0.75;
            const blur = isActive ? 0 : Math.min(3, Math.abs(diff) * 1.5);
            
            return (
              <motion.button
                key={track.id}
                onClick={() => handleTrackClick(index)}
                className={cn(
                  'px-4 py-2 text-base font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'text-foreground border border-foreground/40 rounded'
                    : 'text-foreground/30 border border-transparent'
                )}
                animate={{
                  y: -currentIndex * 44,
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

      {/* 3D Canvas Scene with perspective */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center overflow-visible"
        style={{
          perspective: 1200,
          perspectiveOrigin: 'center center',
        }}
      >
        {/* Floating canvas that follows mouse */}
        <motion.div
          className="relative overflow-visible"
          style={{
            width: isMobile ? '100%' : 2800,
            height: isMobile ? '100%' : 2000,
            transformStyle: 'preserve-3d',
            x: isMobile ? 0 : canvasX,
            y: isMobile ? mobileDragOffset : canvasY,
          }}
          drag={isMobile ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.15}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          {tracks.map((track, index) => {
            const style = getCoverStyle(index);

            return (
              <motion.div
                key={track.id}
                className={cn(
                  'absolute',
                  style.isCenter ? 'cursor-default' : 'cursor-pointer'
                )}
                style={{
                  width: coverSize,
                  height: coverSize,
                  left: '50%',
                  top: '50%',
                  marginLeft: -coverSize / 2,
                  marginTop: -coverSize / 2,
                  zIndex: style.zIndex,
                  transformStyle: 'preserve-3d',
                }}
                animate={{
                  x: style.offsetX,
                  y: style.offsetY,
                  z: style.translateZ,
                  scale: style.isCenter && isPressed ? 0.94 : style.scale,
                  opacity: style.opacity,
                }}
                transition={{ type: 'spring', ...springConfig }}
                onClick={() => !style.isCenter && handleTrackClick(index)}
                onMouseDown={() => style.isCenter && setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
              >
                {/* 3D rotation wrapper for center cover */}
                <motion.div
                  className="w-full h-full"
                  style={{
                    transformStyle: 'preserve-3d',
                    rotateY: style.isCenter && !isMobile ? rotateY : 0,
                    rotateX: style.isCenter && !isMobile ? rotateX : 0,
                  }}
                >
                  {/* Real box-shadow for depth */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      boxShadow: style.isCenter
                        ? '0 50px 100px -20px rgba(0,0,0,0.5), 0 30px 60px -20px rgba(0,0,0,0.4)'
                        : style.diff < 0
                          ? '15px 15px 50px rgba(0,0,0,0.35)'
                          : '0 40px 80px -10px rgba(0,0,0,0.4)',
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
                      className="absolute inset-0 pointer-events-none bg-foreground"
                      style={{ 
                        opacity: 0.25 + Math.abs(style.diff) * 0.1,
                      }}
                    />
                  )}

                  {/* Border frame for center */}
                  {style.isCenter && (
                    <div 
                      className="absolute inset-0 pointer-events-none border border-foreground/10"
                    />
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Bottom progress bar / slider */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-[280px] md:w-[400px]">
        <div className="relative h-[2px] bg-foreground/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            animate={{
              width: `${((currentIndex + 1) / tracks.length) * 100}%`,
            }}
            transition={{ type: 'spring', ...snapSpring }}
          />
        </div>
        
        {/* Invisible range input */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={currentIndex / Math.max(1, tracks.length - 1)}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-8 -mt-3 opacity-0 cursor-pointer"
          style={{ touchAction: 'none' }}
        />

        {/* Track count */}
        <p className="text-center text-xs text-foreground/50 mt-4 font-medium">
          {currentIndex + 1} / {tracks.length}
        </p>
      </div>
    </section>
  );
});
