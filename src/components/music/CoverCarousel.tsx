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

// Canonical spring configs - EXACT from Lady Gaga source
const springConfig = { stiffness: 400, mass: 0.1, damping: 20 };
const hoverSpring = { stiffness: 100, mass: 0.1, damping: 20 };

// Canonical CSS variables - EXACT from _root_gjbqq_19
const CONFIG = {
  desktop: {
    slideGridSize: 4,
    nextSlideColumnOffset: 4,
    nextSlideRowOffset: 2,
    slideGap: 48,
    canvasHeight: "100vh",
    getSlideSize: (vw: number, vh: number) => Math.max(vw * 0.3, vh * 0.7),
  },
  mobile: {
    slideGridSize: 4,
    nextSlideColumnOffset: 3,
    nextSlideRowOffset: 2,
    slideGap: 28,
    canvasHeight: "90svh",
    getSlideSize: (vw: number, vh: number) => Math.min(vw - 80, vh * 0.9 - vh * 0.2),
  },
};

// Hook to get velocity of a motion value - canonical from Lady Gaga
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

  // CANONICAL: Hover tilt values for center cover (Desktop only)
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
    if (Math.abs(v) < 1) {
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

  // Desktop: Mouse move for hover tilt - canonical behavior
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
      
      const slideEl = orch.querySelector(`.orchestrator-slide:nth-of-type(${index + 1})`) as HTMLElement;
      if (slideEl) {
        const rect = slideEl.getBoundingClientRect();
        const targetScroll = rect.left + rect.width / 2 - window.innerWidth / 2 + orch.scrollLeft;
        
        animate(orch.scrollLeft, targetScroll, {
          duration: Math.abs(currentIndex - index) * 0.3,
          onUpdate: (v) => { orch.scrollLeft = v; },
          onComplete: () => {
            orch.style.setProperty("scroll-snap-type", "x mandatory");
          },
        });
      }
    },
    [currentIndex],
  );

  // Slider drag handlers
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
      orch.scrollLeft += info.delta.x * ((tracks.length - 1) / 2) * (orch.clientWidth / indicator.clientWidth);
    },
    [tracks.length],
  );

  // CANONICAL: Depth offset function U - exact from source
  const getDepthOffset = useCallback(
    (slideIndex: number, slidesCount: number, isMobileView: boolean) => {
      const multiplier = isMobileView ? 200 : 500;
      const halfCount = (slidesCount - 1) / 2;
      const offset = slideIndex - halfCount;
      
      if (slidesCount % 2 === 0) {
        return offset === -0.5 || offset === 0.5
          ? -(offset / halfCount) * multiplier
          : -((offset > 0 ? Math.ceil(offset) : Math.floor(offset)) / halfCount) * multiplier;
      }
      return -(offset / halfCount) * multiplier;
    },
    [],
  );

  // Grid position for each slide - canonical formula
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

  // Canonical grid calculations
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
      {/* Left gradient mask - canonical _root_gjbqq_19:before */}
      <div
        className="absolute top-0 left-0 h-full z-10 pointer-events-none"
        style={{
          width: nonActiveSpaceW,
          display: "inline-block",
          background: isMobile
            ? "linear-gradient(to right, hsl(var(--background)), hsl(var(--background) / 0.3) 40%, transparent)"
            : "linear-gradient(to right, hsl(var(--background)), hsl(var(--background)) 20%, hsl(var(--background) / 0.5) 80%, transparent)",
        }}
      />

      {/* Desktop sidebar - canonical _sidebar_gjbqq_121 */}
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
              const isActive = index === currentIndex;
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

      {/* Mobile nav - canonical _mobileNav_gjbqq_202 */}
      {isMobile && (
        <MobileTextDrum
          tracks={tracks}
          currentIndex={currentIndex}
          onSelect={handleTrackClick}
        />
      )}

      {/* Canvases wrapper - canonical _canvasesWrapper_gjbqq_75 */}
      <div className="grid">
        {/* Visible canvas - canonical _canvasVisibleWrapper_gjbqq_86 */}
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

        {/* Orchestrator canvas - canonical _canvasOrchestratorWrapper_gjbqq_90 */}
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

      {/* Bottom progress indicator - canonical _indicator_gjbqq_105 */}
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

// CANONICAL: Progress indicator component - exact from source
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

  const thumbX = useTransform(
    scrollProgress,
    [0, 1],
    ["calc(0% * (var(--ci-dynamic-number-of-slides) - 1))", "calc(100% * (var(--ci-dynamic-number-of-slides) - 1))"]
  );

  const handleDragStart = (e: unknown, info: { delta: { x: number } }) => {
    setIsDragging(true);
    onDragStart?.();
  };

  const handleDragEnd = (e: unknown, info: { delta: { x: number } }) => {
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
      {/* Track line */}
      <div
        className="absolute top-1/2 -translate-y-1/2 h-[1px] left-0 w-full"
        style={{ background: "hsl(var(--foreground) / 0.3)" }}
      />
      {/* Thumb */}
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
          background: "hsl(var(--foreground))",
          width: `calc(100% / ${numberOfSlides})`,
          ...(!isDragging && { x: thumbX }),
        }}
        drag="x"
        dragMomentum={false}
        dragConstraints={containerRef}
        onPointerDownCapture={(e) => {
          // Start drag on pointer down
        }}
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

  // CANONICAL: rotateX from hover - only for center slide
  const rotateXFromHover = useTransform(hoverTiltY, [-0.5, 0.5], isCenter ? [8, -8] : [0, 0]);
  const smoothRotateX = useSpring(rotateXFromHover, hoverSpring);

  // CANONICAL: rotateY from hover (center) OR velocity (non-center)
  const rotateYFromHover = useTransform(hoverTiltX, [-0.5, 0.5], isCenter ? [-8, 8] : [0, 0]);
  const rotateYFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [-35, 0, -35]
  );
  
  // CANONICAL: Combine hover and velocity - velocity when scrolling, hover when idle
  const rotateY = isCenter ? rotateYFromHover : rotateYFromVelocity;
  const smoothRotateY = useSpring(rotateY, hoverSpring);

  // CANONICAL: Inset shadow opacity from velocity
  const insetFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [isPrev ? 0.5 : 0, isPrev ? (isMobile ? 0.8 : 1) : 0, isPrev ? 0.5 : 0]
  );
  const smoothInsetOpacity = useSpring(insetFromVelocity, hoverSpring);

  // CANONICAL: Scale from velocity
  const scaleFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [1.1, 1, 1.1]
  );
  const smoothScale = useSpring(scaleFromVelocity, hoverSpring);

  // CANONICAL: Shadow X from velocity
  const shadowXFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [30, isNext ? -40 : 0, 30]
  );
  const smoothShadowX = useSpring(shadowXFromVelocity, hoverSpring);

  // CANONICAL: X offset from velocity (depth)
  const depthOffset = getDepthOffset(slideIndex, slidesCount, isMobile);
  const xFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [depthOffset, !isMobile && isNext ? -80 : 0, depthOffset]
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
        {/* Cover image - canonical _showcaseSlideInner_gjbqq_164 */}
        <div className="overflow-hidden rounded flex-shrink-0">
          <img
            src={track.coverUrl}
            alt={`${track.title} - ${track.format} ${track.year}`}
            className="w-full h-full object-cover"
            draggable={false}
            style={{ aspectRatio: "1/1" }}
          />
        </div>

        {/* 3D edge border - canonical _showcaseSlideInnerBorder_gjbqq_167 */}
        <div
          className="absolute top-0 right-[-4px] w-[4px] h-full"
          style={{
            transform: "rotateY(90deg)",
            transformOrigin: "left",
            background: "var(--dynamic-color)",
          }}
        />

        {/* Drop shadow - LIGHT THEME: soft, diffuse shadows */}
        {!isCenter && (
          <motion.div
            className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none rounded"
            initial={{ x: 0, z: -150 }}
            style={{
              scale: 1.05,
              background: "hsl(var(--foreground) / 0.08)",
              filter: "blur(20px)",
              x: smoothShadowX,
              z: -150,
            }}
          />
        )}

        {/* Inset shadow - LIGHT THEME: subtle depth gradient, NO black overlay */}
        {!isCenter && (
          <motion.div
            className="absolute top-0 right-0 w-full h-full z-10 pointer-events-none rounded"
            style={{
              background: `linear-gradient(135deg, transparent 0%, transparent 60%, hsl(var(--foreground) / 0.05) 100%)`,
              backgroundRepeat: "no-repeat",
              opacity: smoothInsetOpacity,
            }}
            initial={{ opacity: isCenter ? 0 : 0.5 }}
          />
        )}
      </motion.div>
    </motion.div>
  );
});
