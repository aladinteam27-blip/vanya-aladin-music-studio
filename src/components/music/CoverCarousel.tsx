import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { motion, useSpring, useTransform, useMotionValue, PanInfo } from 'framer-motion';
import { Track } from '@/data/tracks';
import { cn } from '@/lib/utils';

interface CoverCarouselProps {
  tracks: Track[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onTrackChange?: (track: Track) => void;
}

// Spring config for viscous, inertial movement - stiffness: 40, damping: 20
const springConfig = { stiffness: 40, damping: 20, mass: 1 };

// Cover dimensions
const COVER_SIZE_DESKTOP = 450;
const COVER_SIZE_MOBILE = 280;
const DIAGONAL_OFFSET = 200;

export const CoverCarousel = memo(function CoverCarousel({
  tracks,
  currentIndex,
  onIndexChange,
  onTrackChange,
}: CoverCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringCenter, setIsHoveringCenter] = useState(false);

  // Spring-based position for smooth 3D diagonal movement
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springX = useSpring(targetX, springConfig);
  const springY = useSpring(targetY, springConfig);

  // For mobile swipe offset
  const swipeOffset = useMotionValue(0);

  // 3D tilt for center cover on hover
  const tiltX = useSpring(0, { stiffness: 150, damping: 25 });
  const tiltY = useSpring(0, { stiffness: 150, damping: 25 });

  // Cover size based on viewport
  const coverSize = isMobile ? COVER_SIZE_MOBILE : COVER_SIZE_DESKTOP;

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update spring targets when currentIndex changes
  useEffect(() => {
    const x = -currentIndex * DIAGONAL_OFFSET;
    const y = currentIndex * DIAGONAL_OFFSET;
    targetX.set(x);
    targetY.set(y);
  }, [currentIndex, targetX, targetY]);

  // Mouse movement handler for desktop - gentle floating + tilt
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile || isDragging) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalize mouse position relative to center (-1 to 1)
    const normalizedX = (e.clientX - rect.left - centerX) / centerX;
    const normalizedY = (e.clientY - rect.top - centerY) / centerY;

    // Apply gentle floating movement based on mouse position
    const floatX = normalizedX * 20;
    const floatY = normalizedY * 20;

    targetX.set(-currentIndex * DIAGONAL_OFFSET + floatX);
    targetY.set(currentIndex * DIAGONAL_OFFSET + floatY);

    // Update tilt if hovering center cover
    if (isHoveringCenter) {
      tiltX.set(normalizedY * 10);
      tiltY.set(-normalizedX * 10);
    }
  }, [isMobile, isDragging, currentIndex, targetX, targetY, tiltX, tiltY, isHoveringCenter]);

  // Reset when mouse leaves
  const handleMouseLeave = useCallback(() => {
    tiltX.set(0);
    tiltY.set(0);
    targetX.set(-currentIndex * DIAGONAL_OFFSET);
    targetY.set(currentIndex * DIAGONAL_OFFSET);
  }, [currentIndex, targetX, targetY, tiltX, tiltY]);

  // Pan handlers for drag/swipe
  const handlePanStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handlePan = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isMobile) {
      swipeOffset.set(info.offset.x);
    } else {
      // Desktop: diagonal drag
      const diagonal = (info.offset.x - info.offset.y) / 2;
      targetX.set(-currentIndex * DIAGONAL_OFFSET + diagonal * 0.6);
      targetY.set(currentIndex * DIAGONAL_OFFSET - diagonal * 0.6);
    }
  }, [isMobile, currentIndex, swipeOffset, targetX, targetY]);

  const handlePanEnd = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    const threshold = isMobile ? 50 : 80;
    const velocity = isMobile ? info.velocity.x : (info.velocity.x - info.velocity.y) / 2;
    const offset = isMobile ? info.offset.x : (info.offset.x - info.offset.y) / 2;

    let newIndex = currentIndex;

    if (Math.abs(offset) > threshold || Math.abs(velocity) > 300) {
      if (offset > 0 || velocity > 300) {
        newIndex = Math.max(0, currentIndex - 1);
      } else {
        newIndex = Math.min(tracks.length - 1, currentIndex + 1);
      }
    }

    swipeOffset.set(0);
    onIndexChange(newIndex);
    onTrackChange?.(tracks[newIndex]);
  }, [isMobile, currentIndex, tracks, swipeOffset, onIndexChange, onTrackChange]);

  // Track name click handler
  const handleTrackClick = useCallback((index: number) => {
    onIndexChange(index);
    onTrackChange?.(tracks[index]);
  }, [tracks, onIndexChange, onTrackChange]);

  // Slider change handler
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const newIndex = Math.round(value * (tracks.length - 1));
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      onTrackChange?.(tracks[newIndex]);
    }
  }, [tracks, currentIndex, onIndexChange, onTrackChange]);

  // Calculate style for each cover
  const getCoverTransform = useCallback((index: number) => {
    const diff = index - currentIndex;

    // Z-index layering: upper-left covers on top
    // Previous covers (diff < 0) should be on top (higher z-index)
    const zIndex = diff === 0 ? 20 : (diff < 0 ? 30 + diff : 10 - diff);

    // Opacity
    const opacity = diff === 0 ? 1 : 0.5;

    // Scale
    const scale = diff === 0 ? 1 : 0.88;

    // Position offset along diagonal: upper-left to lower-right
    const offsetX = diff * DIAGONAL_OFFSET;
    const offsetY = -diff * DIAGONAL_OFFSET;

    return { zIndex, opacity, scale, offsetX, offsetY };
  }, [currentIndex]);

  // Combined transform for the 3D grid
  const gridX = useTransform(springX, (x) => x);
  const gridY = useTransform(springY, (y) => y);

  // Mobile swipe interpolation
  const mobileX = useTransform(swipeOffset, (x) => x);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-visible bg-background"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Desktop Track Names - Left Side */}
      {!isMobile && (
        <div className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
          {tracks.map((track, index) => (
            <button
              key={track.id}
              onClick={() => handleTrackClick(index)}
              className={cn(
                'text-left px-4 py-2 text-sm font-medium transition-all duration-300',
                'hover:text-foreground',
                index === currentIndex
                  ? 'text-foreground border border-foreground/30 rounded-lg'
                  : 'text-muted-foreground/50 border border-transparent'
              )}
            >
              {track.title}
            </button>
          ))}
        </div>
      )}

      {/* Mobile Track Names - Center Carousel */}
      {isMobile && (
        <div className="absolute top-20 left-0 right-0 z-40 overflow-visible px-4">
          <motion.div
            className="flex items-center justify-center"
            style={{ x: mobileX }}
          >
            <div className="flex items-center gap-6">
              {tracks.map((track, index) => {
                const diff = index - currentIndex;
                const isActive = diff === 0;
                return (
                  <motion.button
                    key={track.id}
                    onClick={() => handleTrackClick(index)}
                    className={cn(
                      'flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all duration-300 whitespace-nowrap',
                      isActive
                        ? 'text-foreground border border-foreground/30 rounded-lg'
                        : 'text-muted-foreground/40 border border-transparent'
                    )}
                    animate={{
                      x: -currentIndex * 100,
                      opacity: Math.max(0.15, 1 - Math.abs(diff) * 0.5),
                      scale: isActive ? 1 : 0.85,
                    }}
                    transition={springConfig}
                  >
                    {track.title}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* 3D Cover Scene */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          x: isMobile ? mobileX : gridX,
          y: isMobile ? 0 : gridY,
          perspective: 1200,
        }}
        drag={isMobile ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
      >
        {/* Canvas Grid - larger than viewport for floating effect */}
        <div
          className="relative"
          style={{
            width: isMobile ? '100%' : 3300,
            height: isMobile ? coverSize * 1.5 : 2400,
          }}
        >
          {tracks.map((track, index) => {
            const style = getCoverTransform(index);
            const isCenter = index === currentIndex;

            return (
              <motion.div
                key={track.id}
                className={cn(
                  'absolute cover-card',
                  isCenter ? 'cursor-default' : 'cursor-pointer'
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
                  x: isMobile
                    ? (index - currentIndex) * (coverSize + 30)
                    : style.offsetX,
                  y: isMobile ? 0 : style.offsetY,
                  scale: style.scale,
                  opacity: style.opacity,
                  rotateX: isCenter && !isMobile ? tiltX.get() : 0,
                  rotateY: isCenter && !isMobile ? tiltY.get() : 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 40,
                  damping: 20,
                }}
                onMouseEnter={() => isCenter && setIsHoveringCenter(true)}
                onMouseLeave={() => setIsHoveringCenter(false)}
                onClick={() => !isCenter && handleTrackClick(index)}
                whileHover={isCenter && !isMobile ? { scale: 1.02 } : {}}
              >
                {/* Shadow for 3D depth - upper covers cast shadow */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: isCenter
                      ? '0 30px 80px -20px rgba(0,0,0,0.35)'
                      : index < currentIndex
                        ? '15px 15px 40px rgba(0,0,0,0.2)'
                        : '0 20px 60px rgba(0,0,0,0.15)',
                  }}
                />

                {/* Cover Image */}
                <img
                  src={track.coverUrl}
                  alt={`${track.title} - ${track.format} ${track.year}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Darkening overlay for non-center covers */}
                {!isCenter && (
                  <div className="absolute inset-0 bg-foreground/25 pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Bottom Slider Controller - oval pill style */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 w-64 md:w-80">
        <div className="relative">
          {/* Track background */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground/40 rounded-full"
              animate={{
                width: `${((currentIndex + 1) / tracks.length) * 100}%`,
              }}
              transition={springConfig}
            />
          </div>

          {/* Invisible slider input for interaction */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={currentIndex / Math.max(1, tracks.length - 1)}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-8 -mt-3.5 opacity-0 cursor-pointer"
            style={{ touchAction: 'none' }}
          />

          {/* Thumb indicator */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full shadow-lg pointer-events-none"
            animate={{
              left: `calc(${(currentIndex / Math.max(1, tracks.length - 1)) * 100}% - 8px)`,
            }}
            transition={springConfig}
          />
        </div>

        {/* Track indicator text */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {currentIndex + 1} / {tracks.length}
        </p>
      </div>
    </section>
  );
});
