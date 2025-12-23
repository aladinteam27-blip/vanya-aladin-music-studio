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

// Spring config - smooth, viscous, expensive feel
const springConfig = { stiffness: 50, damping: 25, mass: 1.2 };
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
  
  // Spring values for smooth canvas movement
  const canvasX = useSpring(0, springConfig);
  const canvasY = useSpring(0, springConfig);
  
  // 3D rotation for center cover
  const rotateY = useSpring(0, { stiffness: 100, damping: 20 });
  const rotateX = useSpring(0, { stiffness: 100, damping: 20 });
  
  // Mobile drag offset
  const dragX = useMotionValue(0);

  // Check mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mouse move - canvas follows cursor (inverted)
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

    // Move canvas in opposite direction (inverted movement)
    // Large canvas moves slightly to reveal different areas
    canvasX.set(-normalizedX * 80);
    canvasY.set(-normalizedY * 60);

    // 3D tilt effect
    rotateY.set(-normalizedX * 8);
    rotateX.set(normalizedY * 5);
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

  // Mobile drag handlers
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDrag = useCallback((_: any, info: { offset: { x: number } }) => {
    dragX.set(info.offset.x);
  }, [dragX]);

  const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsDragging(false);
    
    const threshold = 60;
    const velocityThreshold = 400;
    let newIndex = currentIndex;

    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > velocityThreshold) {
      if (info.offset.x > 0 || info.velocity.x > velocityThreshold) {
        newIndex = Math.max(0, currentIndex - 1);
      } else {
        newIndex = Math.min(tracks.length - 1, currentIndex + 1);
      }
    }

    // Snap animation
    animate(dragX, 0, snapSpring);
    
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      onTrackChange?.(tracks[newIndex]);
    }
  }, [currentIndex, tracks, dragX, onIndexChange, onTrackChange]);

  // Slider handler
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newIndex = Math.round(value * (tracks.length - 1));
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      onTrackChange?.(tracks[newIndex]);
    }
  }, [tracks, currentIndex, onIndexChange, onTrackChange]);

  // Cover styles based on position
  const getCoverStyle = useCallback((index: number) => {
    const diff = index - currentIndex;
    const absPos = Math.abs(diff);
    
    // Diagonal positioning like Lady Gaga:
    // Previous covers (diff < 0) → upper-left, layered ON TOP
    // Next covers (diff > 0) → lower-right, layered BELOW
    const diagonalX = isMobile ? 0 : 320; // horizontal spread
    const diagonalY = isMobile ? 0 : 240; // vertical spread
    const mobileOffset = 280;
    
    return {
      // Z-index: prev covers on top (higher z), next covers below (lower z)
      zIndex: diff === 0 ? 20 : (diff < 0 ? 30 + diff : 10 - diff),
      // Opacity: center bright, others fade
      opacity: diff === 0 ? 1 : Math.max(0.25, 0.65 - absPos * 0.2),
      // Scale: center full, others shrink with distance
      scale: diff === 0 ? 1 : Math.max(0.55, 0.82 - absPos * 0.12),
      // Position: prev goes upper-left (neg X, neg Y), next goes lower-right (pos X, pos Y)
      offsetX: isMobile ? diff * mobileOffset : diff * diagonalX,
      offsetY: isMobile ? 0 : diff * diagonalY,
      // Center cover has special interactions
      isCenter: diff === 0,
    };
  }, [currentIndex, isMobile]);

  // Interpolated drag transform for mobile
  const mobileSlideX = useTransform(dragX, (x) => x * 0.3);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-foreground"
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
                    ? 'text-background border border-background/50 rounded'
                    : 'text-background/40 hover:text-background/70 border border-transparent'
                )}
              >
                {track.title}
              </button>
            );
          })}
        </nav>
      )}

      {/* Mobile: Track names carousel */}
      {isMobile && (
        <div className="absolute top-24 left-0 right-0 z-50 flex justify-center overflow-visible">
          <div className="flex items-center gap-4">
            {tracks.map((track, index) => {
              const diff = index - currentIndex;
              const isActive = diff === 0;
              const opacity = isActive ? 1 : Math.max(0.2, 0.5 - Math.abs(diff) * 0.2);
              
              return (
                <motion.button
                  key={track.id}
                  onClick={() => handleTrackClick(index)}
                  className={cn(
                    'flex-shrink-0 px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'text-background border border-background/50 rounded'
                      : 'text-background/40 border border-transparent'
                  )}
                  animate={{
                    x: -currentIndex * 120,
                    opacity,
                    scale: isActive ? 1 : 0.9,
                    filter: isActive ? 'blur(0px)' : `blur(${Math.min(2, Math.abs(diff))}px)`,
                  }}
                  transition={{ type: 'spring', ...snapSpring }}
                >
                  {track.title}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3D Canvas Scene */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          perspective: 1200,
          x: isMobile ? mobileSlideX : canvasX,
          y: isMobile ? 0 : canvasY,
        }}
      >
        {/* Large floating grid */}
        <motion.div
          className="relative"
          style={{
            width: isMobile ? '100vw' : 2400,
            height: isMobile ? 'auto' : 1800,
            transformStyle: 'preserve-3d',
          }}
          drag={isMobile ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          {tracks.map((track, index) => {
            const style = getCoverStyle(index);
            const coverSize = isMobile ? 260 : 420;

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
                  scale: style.isCenter && isPressed ? 0.96 : style.scale,
                  opacity: style.opacity,
                }}
                transition={{ type: 'spring', stiffness: 60, damping: 20 }}
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
                  {/* Shadow layer - moves opposite to create depth */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      transform: 'translateZ(-80px)',
                      background: 'transparent',
                      boxShadow: style.isCenter
                        ? '0 40px 100px rgba(0,0,0,0.6), 0 20px 40px rgba(0,0,0,0.4)'
                        : index < currentIndex
                          ? '20px 20px 60px rgba(0,0,0,0.5)'
                          : '0 30px 80px rgba(0,0,0,0.4)',
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

                  {/* Border frame */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      border: style.isCenter ? '1px solid rgba(255,255,255,0.15)' : 'none',
                    }}
                  />

                  {/* Darken overlay for non-center */}
                  {!style.isCenter && (
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: `rgba(0,0,0,${0.3 + Math.abs(index - currentIndex) * 0.1})` }}
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
        <div className="relative h-[2px] bg-background/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-background rounded-full"
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
        <p className="text-center text-xs text-background/50 mt-4 font-medium">
          {currentIndex + 1} / {tracks.length}
        </p>
      </div>
    </section>
  );
});
