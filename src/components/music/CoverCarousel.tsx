import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionValueEvent,
  MotionValue,
  useDragControls,
} from "framer-motion";

import type { Track } from "@/data/tracks";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTextDrum } from "@/components/music/MobileTextDrum";

interface CoverCarouselProps {
  tracks: Track[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onTrackChange?: (track: Track) => void;
}

// CANONICAL spring configs - EXACT from Lady Gaga source
const springConfig = { stiffness: 400, mass: 0.1, damping: 20 };
const hoverSpring = { stiffness: 100, mass: 0.1, damping: 20 };

// CANONICAL CONFIG - EXACT from Lady Gaga: ladygaga.com/music CSS
// DESKTOP: --config-next-slide-colum-offset: 4, --config-next-slide-row-offset: 2
// MOBILE: --config-next-slide-colum-offset: 3, --config-next-slide-row-offset: 2
const CONFIG = {
  // DESKTOP: Symmetric, NO overlap - EXACT Lady Gaga values
  desktop: {
    slideGridSize: 4,
    nextSlideColumnOffset: 4, // EXACT from Lady Gaga CSS
    nextSlideRowOffset: 2,    // EXACT from Lady Gaga CSS
    slideGap: 48,             // EXACT from Lady Gaga CSS
    canvasHeight: "100vh",
    // Lady Gaga: max(30vw, calc(100vh - 30vh)) => max(30vw, 70vh)
    getSlideSize: (vw: number, vh: number) => Math.max(vw * 0.30, vh * 0.70),
  },
  // MOBILE: Overlapping, bottom under center - EXACT Lady Gaga values
  mobile: {
    slideGridSize: 4,
    nextSlideColumnOffset: 3, // EXACT from Lady Gaga CSS
    nextSlideRowOffset: 2,    // EXACT from Lady Gaga CSS
    slideGap: 28,             // EXACT from Lady Gaga CSS
    canvasHeight: "90svh",    // EXACT from Lady Gaga CSS
    // Lady Gaga: min((100vw - 80px), (90svh - 20vh)) => min(vw-80, 70vh)
    getSlideSize: (vw: number, vh: number) => Math.min(vw - 80, vh * 0.70),
  },
};

// Hook to get velocity of a motion value - CANONICAL from Lady Gaga
function useVelocity(value: MotionValue<number>): MotionValue<number> {
  const velocity = useMotionValue(0);
  
  useEffect(() => {
    const updateVelocity = () => {
      const v = value.getVelocity();
      velocity.set(v);
      if (v !== 0) {
        requestAnimationFrame(updateVelocity);
      }
    };
    
    const unsubscribe = value.on("change", () => {
      requestAnimationFrame(updateVelocity);
    });
    
    return unsubscribe;
  }, [value, velocity]);
  
  return velocity;
}

export const CoverCarousel = memo(function CoverCarousel({
  tracks,
  currentIndex,
  onIndexChange,
  onTrackChange,
}: CoverCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orchestratorRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [isDragging, setIsDragging] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lazyIndex, setLazyIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [viewportW, setViewportW] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 375,
  );
  const [viewportH, setViewportH] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerHeight : 667,
  );

  const config = isMobile ? CONFIG.mobile : CONFIG.desktop;
  const slideSize = config.getSlideSize(viewportW, viewportH);

  // CANONICAL: Raw scroll position (0-1 normalized)
  const scrollX = useMotionValue(0);
  const scrollXProgress = useMotionValue(0);
  
  // CANONICAL: Velocity tracking from scroll
  const scrollVelocity = useVelocity(scrollX);
  
  // CANONICAL: Spring-smoothed values for continuous animation
  const smoothProgress = useSpring(scrollXProgress, springConfig);
  const smoothVelocity = useSpring(scrollVelocity, springConfig);

  // CANONICAL: Hover tilt values for ALL covers (not just center)
  const hoverTiltX = useMotionValue(0);
  const hoverTiltY = useMotionValue(0);

  // CANONICAL: Canvas transforms - diagonal movement from progress
  const canvasY = useTransform(
    smoothProgress,
    [0, 1],
    ["calc(0 * var(--config-canvas-height) - 0%)", "calc(1 * var(--config-canvas-height) - 100%)"]
  );
  const canvasX = useTransform(
    smoothProgress,
    [0, 1],
    ["calc((-100% + 100vw) * 0)", "calc((-100% + 100vw) * 1)"]
  );
  
  // Non-spring canvas Y for orchestrator (instant, no spring)
  const canvasYRaw = useTransform(
    scrollXProgress,
    [0, 1],
    ["calc(0 * var(--config-canvas-height) - 0%)", "calc(1 * var(--config-canvas-height) - 100%)"]
  );

  // CANONICAL: Update active index from smooth progress
  useMotionValueEvent(smoothProgress, "change", (v) => {
    const newIndex = Math.min(Math.max(Math.floor(v * tracks.length), 0), tracks.length - 1);
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      onTrackChange?.(tracks[newIndex]);
    }
  });
  
  // CANONICAL: Track lazy index when velocity settles
  useMotionValueEvent(smoothVelocity, "change", (v) => {
    if (Math.abs(v) < 1 && !isAnimating) {
      setLazyIndex(currentIndex);
    }
  });

  // Viewport resize handler
  useEffect(() => {
    const onResize = () => {
      setViewportW(window.innerWidth);
      setViewportH(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    onResize();

    const timer = setTimeout(() => setIsLoaded(true), 120);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, []);

  // CANONICAL: Real scroll handler for orchestrator
  useEffect(() => {
    const orch = orchestratorRef.current;
    if (!orch) return;

    const handleScroll = () => {
      const maxScroll = orch.scrollWidth - orch.clientWidth;
      if (maxScroll > 0) {
        const progress = orch.scrollLeft / maxScroll;
        scrollX.set(orch.scrollLeft);
        scrollXProgress.set(progress);
      }
    };

    orch.addEventListener("scroll", handleScroll, { passive: true });
    return () => orch.removeEventListener("scroll", handleScroll);
  }, [scrollX, scrollXProgress]);

  // Desktop: Mouse move for hover tilt - CANONICAL behavior for ALL cards
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile || isDragging) return;

      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const normalizedX = x / rect.width - 0.5;
      const normalizedY = y / rect.height - 0.5;

      hoverTiltX.set(normalizedX);
      hoverTiltY.set(normalizedY);
    },
    [isMobile, isDragging, hoverTiltX, hoverTiltY],
  );

  const handleMouseLeave = useCallback(() => {
    hoverTiltX.set(0);
    hoverTiltY.set(0);
  }, [hoverTiltX, hoverTiltY]);

  // CANONICAL: Navigate to slide - animate scroll position
  const handleTrackClick = useCallback(
    (index: number) => {
      const orch = orchestratorRef.current;
      if (!orch) return;

      orch.style.setProperty("scroll-snap-type", "none");
      setIsAnimating(true);
      
      const slideEl = orch.querySelector(`.orchestrator-slide:nth-of-type(${index + 1})`) as HTMLElement;
      if (slideEl) {
        const rect = slideEl.getBoundingClientRect();
        const targetScroll = rect.left + rect.width / 2 - window.innerWidth / 2 + orch.scrollLeft;
        
        animate(orch.scrollLeft, targetScroll, {
          duration: Math.abs(currentIndex - index) * 0.3,
          onUpdate: (v) => { orch.scrollLeft = v; },
          onComplete: () => {
            orch.style.setProperty("scroll-snap-type", "x mandatory");
            setIsAnimating(false);
          },
        });
      }
    },
    [currentIndex],
  );

  // CANONICAL: Slider drag handlers - exact from Lady Gaga source
  const handleSliderDragStart = useCallback(() => {
    setIsDragging(true);
    const orch = orchestratorRef.current;
    if (orch) orch.style.setProperty("scroll-snap-type", "none");
  }, []);

  const handleSliderDragEnd = useCallback(() => {
    setIsDragging(false);
    const orch = orchestratorRef.current;
    if (orch) orch.style.setProperty("scroll-snap-type", "x mandatory");
  }, []);

  const handleSliderDrag = useCallback(
    (_: unknown, info: { delta: { x: number } }) => {
      const orch = orchestratorRef.current;
      const indicator = indicatorRef.current;
      if (!orch || !indicator) return;
      // CANONICAL formula: delta.x * ((slides-1)/2) * (scrollWidth/indicatorWidth)
      orch.scrollLeft += info.delta.x * ((tracks.length - 1) / 2) * (orch.clientWidth / indicator.clientWidth);
    },
    [tracks.length],
  );

  // CANONICAL: Depth offset function U - EXACT from Lady Gaga source
  const getDepthOffset = useCallback(
    (slideIndex: number, slidesCount: number, isMobileView: boolean) => {
      // EXACT formula from Lady Gaga: const e=s?200:500, r=(n-1)/2, a=o-r
      const multiplier = isMobileView ? 200 : 500;
      const halfCount = (slidesCount - 1) / 2;
      const offset = slideIndex - halfCount;
      
      // EXACT from source: n%2===0?a===-.5||a===.5?-(a/r)*e:-((a>0?Math.ceil(a):Math.floor(a))/r)*e:-(a/r)*e
      if (slidesCount % 2 === 0) {
        return offset === -0.5 || offset === 0.5
          ? -(offset / halfCount) * multiplier
          : -((offset > 0 ? Math.ceil(offset) : Math.floor(offset)) / halfCount) * multiplier;
      }
      return -(offset / halfCount) * multiplier;
    },
    [],
  );

  // Grid position for each slide - CANONICAL formula
  const getGridPosition = useCallback(
    (slideIndex: number) => {
      const gridRow = slideIndex * config.nextSlideRowOffset + 1;
      const gridColumn = slideIndex * config.nextSlideColumnOffset + 1;
      return {
        gridRow: `${gridRow} / span ${config.slideGridSize}`,
        gridColumn: `${gridColumn} / span ${config.slideGridSize}`,
      };
    },
    [config],
  );

  // CANONICAL grid calculations
  const gridCols = tracks.length * config.slideGridSize - (tracks.length - 1) * -1 * (config.nextSlideColumnOffset - config.slideGridSize);
  const gridRows = tracks.length * config.slideGridSize - (tracks.length - 1) * -1 * (config.nextSlideRowOffset - config.slideGridSize);
  const gapOverall = config.slideGap * (config.slideGridSize - 1);
  const cellSize = (slideSize - gapOverall) / config.slideGridSize;
  const nonActiveSpaceW = (viewportW - slideSize) / 2;
  const nonActiveSpaceH = ((isMobile ? viewportH * 0.9 : viewportH) - slideSize) / 2;

  // CSS variables
  const cssVars = {
    "--dynamic-number-of-slides": tracks.length,
    "--dynamic-active-slide-index": currentIndex,
    "--config-slide-grid-size": config.slideGridSize,
    "--config-next-slide-colum-offset": config.nextSlideColumnOffset,
    "--config-next-slide-row-offset": config.nextSlideRowOffset,
    "--config-slide-gap": `${config.slideGap}px`,
    "--config-slide-size": `${slideSize}px`,
    "--config-canvas-height": config.canvasHeight,
    "--helper-non-active-space-width": `${nonActiveSpaceW}px`,
    "--helper-non-active-space-height": `${nonActiveSpaceH}px`,
  } as React.CSSProperties;

  return (
    <section
      ref={containerRef}
      className="relative w-screen overflow-hidden bg-background"
      style={{
        ...cssVars,
        height: config.canvasHeight,
      }}
    >
      {/* Left gradient mask - CANONICAL from Lady Gaga: black gradient */}
      <div
        className="absolute top-0 left-0 h-full z-10 pointer-events-none"
        style={{
          width: nonActiveSpaceW,
          display: "inline-block",
          // EXACT from Lady Gaga CSS: linear-gradient(to right,#000,#0003 40%,#0000) for mobile
          // linear-gradient(to right,#000,#000 20%,#0000004d 80%,#0000) for desktop
          background: isMobile
            ? "linear-gradient(to right, #000, rgba(0,0,0,0.2) 40%, transparent)"
            : "linear-gradient(to right, #000, #000 20%, rgba(0,0,0,0.3) 80%, transparent)",
        }}
      />

      {/* Right gradient - subtle for symmetry */}
      <div
        className="absolute top-0 right-0 h-full z-10 pointer-events-none"
        style={{
          width: nonActiveSpaceW * 0.5,
          display: "inline-block",
          background: "linear-gradient(to left, rgba(0,0,0,0.15), transparent)",
        }}
      />

      {/* Desktop sidebar - CANONICAL _sidebar_gjbqq_121 */}
      {!isMobile && (
        <aside
          className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-20"
          style={{
            maxWidth: nonActiveSpaceW,
            padding: `20px 0 20px max(24px, calc((100vw - 1660px) / 2 + 24px))`,
          }}
        >
          <nav className="flex flex-col gap-0.5">
            {tracks.map((track, index) => {
              const isActive = isAnimating ? lazyIndex === index : index === currentIndex;
              return (
                <motion.button
                  key={track.id}
                  onClick={() => handleTrackClick(index)}
                  tabIndex={-1}
                  className={cn(
                    "text-left px-4 py-2 text-sm font-medium transition-colors duration-300",
                    isActive
                      ? "text-foreground"
                      : "text-foreground/30 hover:text-foreground/60",
                  )}
                  initial={{ opacity: isActive ? 1 : 0.4 }}
                  animate={{ opacity: isActive ? 1 : 0.4 }}
                  transition={{ duration: 0.3 }}
                >
                  {track.title}
                </motion.button>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Mobile nav - CANONICAL _mobileNav_gjbqq_202 */}
      {isMobile && (
        <MobileTextDrum
          tracks={tracks}
          currentIndex={isAnimating ? lazyIndex : currentIndex}
          onSelect={handleTrackClick}
        />
      )}

      {/* Canvases wrapper - CANONICAL _canvasesWrapper_gjbqq_75 */}
      <div className="grid">
        {/* Visible canvas - CANONICAL _canvasVisibleWrapper_gjbqq_86 */}
        <div
          className="overflow-hidden pointer-events-none"
          style={{
            gridColumn: "1/1",
            gridRow: "1/1",
            width: "100%",
            height: config.canvasHeight,
          }}
        >
          <motion.ul
            className="inline-grid list-none"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridRows}, ${cellSize}px)`,
              gap: config.slideGap,
              padding: `${nonActiveSpaceH}px ${nonActiveSpaceW}px`,
              y: canvasY,
              x: canvasX,
              z: 0,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <AnimatePresence mode="sync">
              {tracks.map((track, slideIndex) => {
                const gridPos = getGridPosition(slideIndex);
                const entranceDelay = slideIndex * 0.06;
                const zIndex = tracks.length - slideIndex;

                return (
                  <motion.li
                    key={track.id}
                    className="relative visible-slide"
                    style={{
                      ...gridPos,
                      zIndex,
                      "--dynamic-slide-index": slideIndex,
                      "--dynamic-color": "hsl(var(--foreground) / 0.5)",
                    } as React.CSSProperties}
                    initial={isLoaded ? false : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: "spring",
                      ...hoverSpring,
                      delay: isLoaded ? 0 : entranceDelay,
                    }}
                  >
                    <CanonicalSlide
                      track={track}
                      slideIndex={slideIndex}
                      slidesCount={tracks.length}
                      activeSlideIndex={currentIndex}
                      isPanning={isPanning}
                      isMobile={isMobile}
                      hoverTiltX={hoverTiltX}
                      hoverTiltY={hoverTiltY}
                      scrollVelocity={smoothVelocity}
                      getDepthOffset={getDepthOffset}
                    />
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        </div>

        {/* Orchestrator canvas - CANONICAL _canvasOrchestratorWrapper_gjbqq_90 */}
        {/* THIS IS THE REAL SCROLL CONTAINER - wheel/touch/touchpad drives the animation */}
        <div
          ref={orchestratorRef}
          className="z-10 overflow-y-hidden overflow-x-scroll hide-scrollbar"
          style={{
            gridColumn: "1/1",
            gridRow: "1/1",
            width: "100%",
            height: config.canvasHeight,
            scrollSnapType: "x mandatory",
            overscrollBehaviorX: "contain",
          }}
          onTouchMove={() => setIsPanning(true)}
          onTouchEnd={() => setIsPanning(false)}
        >
          <motion.div
            className="inline-grid"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridRows}, ${cellSize}px)`,
              gap: config.slideGap,
              padding: `${nonActiveSpaceH}px ${nonActiveSpaceW}px`,
              y: canvasYRaw,
            }}
          >
            {tracks.map((track, slideIndex) => {
              const isActive = slideIndex === currentIndex;
              const gridPos = getGridPosition(slideIndex);

              return (
                <a
                  key={track.id}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleTrackClick(slideIndex);
                  }}
                  onFocus={() => handleTrackClick(slideIndex)}
                  className={cn(
                    "orchestrator-slide",
                    isActive ? "" : "pointer-events-none",
                  )}
                  style={{
                    ...gridPos,
                    scrollSnapAlign: "center",
                    "--dynamic-slide-index": slideIndex,
                  } as React.CSSProperties}
                  aria-label={track.title}
                />
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Bottom progress indicator - CANONICAL _indicator_gjbqq_105 */}
      <div
        ref={indicatorRef}
        className="absolute z-10 overflow-hidden left-1/2 -translate-x-1/2"
        style={{
          bottom: `calc((${config.canvasHeight} - ${slideSize}px) / 4)`,
          width: isMobile ? "calc(100vw - 32px)" : slideSize,
        }}
      >
        <ProgressIndicator
          numberOfSlides={tracks.length}
          scrollProgress={smoothProgress}
          onDragStart={handleSliderDragStart}
          onDragEnd={handleSliderDragEnd}
          onDrag={handleSliderDrag}
        />
        <p className="text-center text-xs text-foreground/40 mt-2 font-medium tracking-wide">
          {currentIndex + 1} / {tracks.length}
        </p>
      </div>
    </section>
  );
});

// CANONICAL: Progress indicator component - EXACT from source
interface ProgressIndicatorProps {
  numberOfSlides: number;
  scrollProgress: MotionValue<number>;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrag?: (e: unknown, info: { delta: { x: number } }) => void;
}

const indicatorVariants = {
  initial: { scaleY: 1 / 8 },
  rootHover: { scaleY: 0.5 },
  hover: { scaleY: 1 },
  drag: { cursor: "grabbing" },
};

const ProgressIndicator = memo(function ProgressIndicator({
  numberOfSlides,
  scrollProgress,
  onDragStart,
  onDragEnd,
  onDrag,
}: ProgressIndicatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // CANONICAL: Use drag controls like Lady Gaga source
  const dragControls = useDragControls();

  const thumbX = useTransform(
    scrollProgress,
    [0, 1],
    ["calc(0% * (var(--ci-dynamic-number-of-slides) - 1))", "calc(100% * (var(--ci-dynamic-number-of-slides) - 1))"]
  );

  const handleDragStart = () => {
    setIsDragging(true);
    onDragStart?.();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsHovered(false);
    onDragEnd?.();
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-8"
      style={{ "--ci-dynamic-number-of-slides": numberOfSlides } as React.CSSProperties}
    >
      {/* Track line - EXACT from Lady Gaga: #ffffff4d */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-[1px] left-0 w-full"
        style={{ background: "rgba(255,255,255,0.3)" }}
      />
      {/* Thumb - CANONICAL with dragControls, white */}
      <motion.div
        initial="initial"
        whileHover="hover"
        whileDrag="drag"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrag={onDrag}
        dragListener={false}
        animate={isHovered ? "rootHover" : "initial"}
        variants={indicatorVariants}
        className="absolute top-[calc(50%-4px)] left-0 h-2 rounded-full cursor-grab active:cursor-grabbing"
        style={{
          background: "#fff",
          width: `calc(100% / ${numberOfSlides})`,
          ...(!isDragging && { x: thumbX }),
        }}
        drag="x"
        dragMomentum={false}
        dragConstraints={containerRef}
        dragControls={dragControls}
        onPointerDownCapture={(e) => dragControls.start(e, { snapToCursor: true })}
      />
    </div>
  );
});

// CANONICAL: Slide component with all 3D transforms driven by velocity
interface CanonicalSlideProps {
  track: Track;
  slideIndex: number;
  slidesCount: number;
  activeSlideIndex: number;
  isPanning: boolean;
  isMobile: boolean;
  hoverTiltX: MotionValue<number>;
  hoverTiltY: MotionValue<number>;
  scrollVelocity: MotionValue<number>;
  getDepthOffset: (slideIndex: number, slidesCount: number, isMobile: boolean) => number;
}

const CanonicalSlide = memo(function CanonicalSlide({
  track,
  slideIndex,
  slidesCount,
  activeSlideIndex,
  isPanning,
  isMobile,
  hoverTiltX,
  hoverTiltY,
  scrollVelocity,
  getDepthOffset,
}: CanonicalSlideProps) {
  const velocityRange = isMobile ? 80 : 1000;
  
  const isCenter = slideIndex === activeSlideIndex;
  const isPrev = activeSlideIndex > slideIndex;
  const isNext = activeSlideIndex < slideIndex;

  // CANONICAL: rotateX from hover - soft cursor-based tilt for center AND all cards on hover
  const rotateXFromHover = useTransform(hoverTiltY, [-0.5, 0.5], [8, -8]);
  const smoothRotateX = useSpring(rotateXFromHover, hoverSpring);

  // CANONICAL: rotateY - ALL cards rotate from velocity
  // FIX: Every card including first must rotate when there's velocity
  const rotateYFromHover = useTransform(hoverTiltX, [-0.5, 0.5], [-8, 8]);
  const rotateYFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [-25, 0, -25]
  );
  
  // IMPORTANT FIX: ALL cards rotate from velocity, center ALSO gets hover tilt
  // This ensures first card rotates too
  const baseRotateY = useTransform(scrollVelocity, (v) => {
    const velocityRotation = (Math.abs(v) / velocityRange) * -25;
    return velocityRotation;
  });
  const rotateY = isCenter ? rotateYFromHover : baseRotateY;
  const smoothRotateY = useSpring(rotateY, hoverSpring);

  // CANONICAL: Inset shadow - soft gradient overlays, NO hard borders
  // isPrev (upper-left card): soft shadow at bottom-right corner
  // isNext (lower-right card): soft shadow at top-left corner
  const insetFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [isPrev ? 0.4 : (isNext ? 0.6 : 0), isPrev || isNext ? 0.3 : 0, isPrev ? 0.4 : (isNext ? 0.6 : 0)]
  );
  const smoothInsetOpacity = useSpring(insetFromVelocity, hoverSpring);

  // CANONICAL: Scale from velocity - subtle for depth
  const scaleFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [1.05, 1, 1.05]
  );
  const smoothScale = useSpring(scaleFromVelocity, hoverSpring);

  // CANONICAL: Shadow X from velocity - soft depth feel
  const shadowXFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [20, isNext ? -30 : 0, 20]
  );
  const smoothShadowX = useSpring(shadowXFromVelocity, hoverSpring);

  // CANONICAL: X offset from velocity (depth)
  // EXACT from Lady Gaga:
  // - desktop (lg): center spacing only via depthOffset
  // - mobile (!lg): previous slide gets a resting offset -80px so it tucks UNDER the center
  const depthOffset = getDepthOffset(slideIndex, slidesCount, isMobile);
  const xFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [
      depthOffset,
      isMobile && isPrev ? -80 : 0,
      depthOffset,
    ],
  );
  const smoothX = useSpring(xFromVelocity, hoverSpring);

  return (
    <motion.div
      style={{
        x: smoothX,
        perspective: "100vw",
      }}
    >
      <motion.div
        className="relative showcase-slide-inner"
        style={{
          transformStyle: "preserve-3d",
          rotateY: smoothRotateY,
          rotateX: isCenter ? smoothRotateX : 0,
          scale: isCenter ? 1 : smoothScale,
        }}
      >
        {/* Cover image - CANONICAL _showcaseSlideInner_gjbqq_164 */}
        <div className="overflow-hidden rounded flex-shrink-0">
          <img
            src={track.coverUrl}
            alt={`${track.title} - ${track.format} ${track.year}`}
            className="w-full h-full object-cover"
            draggable={false}
            style={{ aspectRatio: "1/1" }}
          />
        </div>

        {/* 3D edge border - CANONICAL _showcaseSlideInnerBorder_gjbqq_167 */}
        <div
          className="absolute top-0 right-[-4px] w-[4px] h-full"
          style={{
            transform: "rotateY(90deg)",
            transformOrigin: "left",
            background: "var(--dynamic-color)",
          }}
        />

        {/* Drop shadow - CANONICAL _showcaseSlideInnerDropShadow_gjbqq_177 */}
        {/* DARK THEME: Only behind non-center cards, soft blur */}
        {!isCenter && (
          <motion.div
            className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none rounded"
            initial={{ x: 0, z: -150 }}
            style={{
              scale: 1.2, // EXACT from source
              // EXACT from Lady Gaga: #0009 = rgba(0,0,0,0.6)
              background: "rgba(0,0,0,0.6)",
              filter: "blur(12px)", // EXACT from source
              x: smoothShadowX,
              z: -150,
            }}
          />
        )}

        {/* Inset shadow - SOFT gradient, NO borders, NO hard edges */}
        {/* Lady Gaga principle: soft corner darkening that fades naturally */}
        {!isCenter && (
          <motion.div
            className="absolute top-0 right-0 w-full h-full z-10 pointer-events-none rounded"
            style={{
              // SOFT gradients - NO hard borders, just gentle corner darkening
              // isPrev (upper card): darken bottom-right corner
              // isNext (lower card): darken top-left corner + slides under center
              background: isPrev 
                ? `radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)`
                : `radial-gradient(ellipse at 20% 20%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)`,
              opacity: smoothInsetOpacity,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
});
