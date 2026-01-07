import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
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

// Canonical spring configs from Lady Gaga source
const springConfig = { stiffness: 400, mass: 0.1, damping: 20 };
const hoverSpring = { stiffness: 100, mass: 0.1, damping: 20 };
const snapSpring = { stiffness: 300, damping: 35 };

// Canonical CSS variables - EXACT from _root_gjbqq_19
const CONFIG = {
  desktop: {
    slideGridSize: 4,
    nextSlideColumnOffset: 4,
    nextSlideRowOffset: 2,
    slideGap: 48,
    canvasHeight: "100vh",
    // max(30vw, calc(100vh - 30vh))
    getSlideSize: (vw: number, vh: number) => Math.max(vw * 0.3, vh * 0.7),
  },
  mobile: {
    slideGridSize: 4,
    nextSlideColumnOffset: 3,
    nextSlideRowOffset: 2,
    slideGap: 28,
    canvasHeight: "90svh",
    // min(calc(100vw - 80px), calc(90svh - 20vh))
    getSlideSize: (vw: number, vh: number) => Math.min(vw - 80, vh * 0.9 - vh * 0.2),
  },
};

type SwipeState = {
  startX: number;
  lastX: number;
  startT: number;
  lastT: number;
};

export const CoverCarousel = memo(function CoverCarousel({
  tracks,
  currentIndex,
  onIndexChange,
  onTrackChange,
}: CoverCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const orchestratorRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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

  // Motion values - canonical scroll-based system
  const scrollProgress = useMotionValue(0);
  const scrollVelocity = useMotionValue(0);
  const smoothProgress = useSpring(scrollProgress, springConfig);
  const smoothVelocity = useSpring(scrollVelocity, springConfig);

  // Hover tilt values for center cover (Desktop)
  const hoverTiltX = useMotionValue(0);
  const hoverTiltY = useMotionValue(0);

  // Mobile gesture offsets
  const dragOffset = useMotionValue(0);
  const textDrumOffset = useMotionValue(0);
  const swipeRef = useRef<SwipeState | null>(null);

  // Canonical canvas transforms - diagonal movement
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

  // Canonical: velocity-based rotation for non-center slides
  const velocityRotateY = useTransform(
    smoothVelocity,
    [-1000, 0, 1000],
    [-35, 0, -35]
  );

  // Canonical: velocity-based scale
  const velocityScale = useTransform(
    smoothVelocity,
    [-1000, 0, 1000],
    [1.1, 1, 1.1]
  );

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

  // Update scroll progress on index change
  useEffect(() => {
    const progress = currentIndex / Math.max(1, tracks.length - 1);
    const duration = Math.abs(currentIndex - lazyIndex) * 0.3;
    animate(scrollProgress, progress, { duration: Math.max(0.2, duration) });
  }, [currentIndex, tracks.length, scrollProgress, lazyIndex]);

  // Track lazy index for smooth transitions
  useEffect(() => {
    const unsubscribe = smoothVelocity.on("change", (v) => {
      if (v === 0) {
        setLazyIndex(currentIndex);
      }
    });
    return unsubscribe;
  }, [smoothVelocity, currentIndex]);

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
    setIsHovered(false);
  }, [hoverTiltX, hoverTiltY]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleTrackClick = useCallback(
    (index: number) => {
      // Canonical: animate scroll to target slide
      const orch = orchestratorRef.current;
      if (orch) {
        orch.style.setProperty("scroll-snap-type", "none");
        const targetSlide = orch.querySelector(`.orchestrator-slide:nth-of-type(${index + 1})`) as HTMLElement;
        if (targetSlide) {
          const rect = targetSlide.getBoundingClientRect();
          const targetScroll = rect.left + rect.width / 2 - window.innerWidth / 2 + orch.scrollLeft;
          animate(orch.scrollLeft, targetScroll, {
            duration: Math.abs(currentIndex - index) * 0.3,
            onUpdate: (v) => { orch.scrollLeft = v; },
            onComplete: () => {
              orch.style.setProperty("scroll-snap-type", "x mandatory");
            },
          });
        }
      }
      onIndexChange(index);
      onTrackChange?.(tracks[index]);
    },
    [currentIndex, tracks, onIndexChange, onTrackChange],
  );

  // Mobile: horizontal swipe handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isMobile) return;
      swipeRef.current = {
        startX: e.clientX,
        lastX: e.clientX,
        startT: performance.now(),
        lastT: performance.now(),
      };
      setIsDragging(true);
      setIsPanning(true);
    },
    [isMobile],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isMobile) return;
      const s = swipeRef.current;
      if (!s) return;

      const now = performance.now();
      s.lastX = e.clientX;
      s.lastT = now;

      const dx = e.clientX - s.startX;
      dragOffset.set(dx);
      textDrumOffset.set(dx);
    },
    [isMobile, dragOffset, textDrumOffset],
  );

  const finishSwipe = useCallback(() => {
    if (!isMobile) return;
    const s = swipeRef.current;
    if (!s) return;

    swipeRef.current = null;
    setIsDragging(false);
    setIsPanning(false);

    const dx = dragOffset.get();
    const dt = Math.max(1, s.lastT - s.startT);
    const vx = ((s.lastX - s.startX) / dt) * 1000;

    const threshold = 50;
    const velocityThreshold = 400;

    let newIndex = currentIndex;

    if (Math.abs(dx) > threshold || Math.abs(vx) > velocityThreshold) {
      if (dx < -threshold || vx < -velocityThreshold) {
        newIndex = Math.min(tracks.length - 1, currentIndex + 1);
      } else if (dx > threshold || vx > velocityThreshold) {
        newIndex = Math.max(0, currentIndex - 1);
      }
    }

    animate(dragOffset, 0, snapSpring);
    animate(textDrumOffset, 0, snapSpring);

    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      onTrackChange?.(tracks[newIndex]);
    }
  }, [isMobile, currentIndex, tracks, dragOffset, textDrumOffset, onIndexChange, onTrackChange]);

  const handlePointerUp = useCallback(() => finishSwipe(), [finishSwipe]);
  const handlePointerCancel = useCallback(() => finishSwipe(), [finishSwipe]);

  // Slider handlers
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
    (e: React.MouseEvent, info: { delta: { x: number } }) => {
      const orch = orchestratorRef.current;
      const indicator = e.currentTarget.parentElement;
      if (!orch || !indicator) return;
      orch.scrollLeft += info.delta.x * ((tracks.length - 1) / 2) * (orch.clientWidth / indicator.clientWidth);
    },
    [tracks.length],
  );

  // Calculate canonical depth offset U function from source
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
        touchAction: "pan-y pan-x",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
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
          offset={textDrumOffset}
        />
      )}

      {/* Canvases wrapper - canonical _canvasesWrapper_gjbqq_75 */}
      <div className="grid">
        {/* Visible canvas - canonical _canvasVisibleWrapper_gjbqq_86 */}
        <div
          className="overflow-hidden"
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
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <AnimatePresence mode="sync">
              {tracks.map((track, slideIndex) => {
                const gridPos = getGridPosition(slideIndex);
                const entranceDelay = slideIndex * 0.06;
                
                const diff = slideIndex - currentIndex;
                const isCenter = diff === 0;
                const isPrev = diff < 0;
                const isNext = diff > 0;
                const zIndex = tracks.length - slideIndex;

                // Canonical depth offset
                const depthOffset = getDepthOffset(slideIndex, tracks.length, isMobile);
                const xOffset = isNext && isMobile ? -80 : (isNext && !isMobile ? -40 : 0);

                // Canonical inset shadow opacity
                const insetOpacity = isCenter ? 0 : isPrev ? (isMobile ? 0.5 : 0.8) : 0.5;

                // Canonical shadow X
                const shadowX = isCenter ? 0 : isNext ? -40 : 30;

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
                    {/* Perspective wrapper - canonical */}
                    <CanonicalSlide
                      track={track}
                      slideIndex={slideIndex}
                      isCenter={isCenter}
                      isPrev={isPrev}
                      isNext={isNext}
                      isPanning={isPanning}
                      isMobile={isMobile}
                      isPressed={isPressed}
                      setIsPressed={setIsPressed}
                      hoverTiltX={hoverTiltX}
                      hoverTiltY={hoverTiltY}
                      scrollVelocity={smoothVelocity}
                      depthOffset={depthOffset}
                      xOffset={xOffset}
                      insetOpacity={insetOpacity}
                      shadowX={shadowX}
                      onSelect={() => !isCenter && handleTrackClick(slideIndex)}
                    />
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        </div>

        {/* Orchestrator canvas - canonical _canvasOrchestratorWrapper_gjbqq_90 */}
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
              y: canvasY,
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
        className="absolute z-10 overflow-hidden left-1/2 -translate-x-1/2"
        style={{
          bottom: `calc((${config.canvasHeight} - ${slideSize}px) / 4)`,
          width: isMobile ? "calc(100vw - 32px)" : slideSize,
        }}
      >
        <div className="relative w-full h-8">
          {/* Track line - canonical _root_88mzc_19:before */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[1px] left-0 w-full"
            style={{ background: "hsl(var(--foreground) / 0.3)" }}
          />
          {/* Thumb - canonical _thumb_88mzc_35 */}
          <motion.div
            className="absolute top-[calc(50%-4px)] left-0 h-2 rounded-full cursor-grab active:cursor-grabbing"
            style={{
              background: "hsl(var(--foreground))",
              width: `calc(100% / ${tracks.length})`,
              left: `calc(${currentIndex} * 100% / ${tracks.length})`,
              transformOrigin: "center",
            }}
            initial={{ scaleY: 0.125 }}
            animate={{ 
              scaleY: isHovered ? 0.5 : isDragging ? 1 : 0.125,
            }}
            whileHover={{ scaleY: 1 }}
            whileDrag={{ cursor: "grabbing" }}
            transition={{ type: "spring", ...springConfig }}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={currentIndex / Math.max(1, tracks.length - 1)}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              const newIndex = Math.round(value * (tracks.length - 1));
              if (newIndex !== currentIndex) {
                onIndexChange(newIndex);
                onTrackChange?.(tracks[newIndex]);
              }
            }}
            onMouseDown={handleSliderDragStart}
            onMouseUp={handleSliderDragEnd}
            onTouchStart={handleSliderDragStart}
            onTouchEnd={handleSliderDragEnd}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ touchAction: "pan-y" }}
          />
        </div>
        <p className="text-center text-xs text-foreground/40 mt-2 font-medium tracking-wide">
          {currentIndex + 1} / {tracks.length}
        </p>
      </div>
    </section>
  );
});

// Canonical slide component with all 3D transforms
interface CanonicalSlideProps {
  track: Track;
  slideIndex: number;
  isCenter: boolean;
  isPrev: boolean;
  isNext: boolean;
  isPanning: boolean;
  isMobile: boolean;
  isPressed: boolean;
  setIsPressed: (v: boolean) => void;
  hoverTiltX: ReturnType<typeof useMotionValue<number>>;
  hoverTiltY: ReturnType<typeof useMotionValue<number>>;
  scrollVelocity: ReturnType<typeof useSpring>;
  depthOffset: number;
  xOffset: number;
  insetOpacity: number;
  shadowX: number;
  onSelect: () => void;
}

const CanonicalSlide = memo(function CanonicalSlide({
  track,
  slideIndex,
  isCenter,
  isPrev,
  isNext,
  isPanning,
  isMobile,
  isPressed,
  setIsPressed,
  hoverTiltX,
  hoverTiltY,
  scrollVelocity,
  depthOffset,
  xOffset,
  insetOpacity,
  shadowX,
  onSelect,
}: CanonicalSlideProps) {
  const velocityRange = isMobile ? 80 : 1000;

  // Canonical rotateX from hover - only for center
  const rotateXFromHover = useTransform(hoverTiltY, [-0.5, 0.5], isCenter ? [8, -8] : [0, 0]);
  const smoothRotateX = useSpring(rotateXFromHover, hoverSpring);

  // Canonical rotateY: velocity-based OR hover-based for center
  const rotateYFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [-35, 0, -35]
  );
  const rotateYFromHover = useTransform(hoverTiltX, [-0.5, 0.5], isCenter ? [-8, 8] : [0, 0]);
  
  // Use velocity for non-center, hover for center
  const rotateY = isCenter ? rotateYFromHover : rotateYFromVelocity;
  const smoothRotateY = useSpring(rotateY, hoverSpring);

  // Canonical scale from velocity
  const scaleFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [1.1, 1, 1.1]
  );
  const smoothScale = useSpring(scaleFromVelocity, hoverSpring);

  // Canonical shadow X from velocity
  const shadowXFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [30, isNext ? -40 : 0, 30]
  );
  const smoothShadowX = useSpring(shadowXFromVelocity, hoverSpring);

  // Canonical X offset from velocity
  const xFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [depthOffset, !isMobile && isNext ? -80 : 0, depthOffset]
  );
  const smoothX = useSpring(xFromVelocity, hoverSpring);

  // Canonical inset opacity from velocity
  const insetFromVelocity = useTransform(
    scrollVelocity,
    [-velocityRange, 0, velocityRange],
    [isPrev ? 0.5 : 0, isPrev ? (isMobile ? 0.8 : 1) : 0, isPrev ? 0.5 : 0]
  );
  const smoothInsetOpacity = useSpring(
    isPanning ? insetFromVelocity : insetOpacity,
    hoverSpring
  );

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
        animate={{
          scale: isCenter && isPressed ? 0.95 : 1,
        }}
        transition={{ type: "spring", ...hoverSpring }}
        onMouseDown={() => isCenter && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onClick={onSelect}
      >
        {/* Cover image - canonical _showcaseSlideInner_gjbqq_164 */}
        <div
          className={cn(
            "overflow-hidden rounded flex-shrink-0",
            isCenter ? "cursor-default" : "cursor-pointer",
          )}
        >
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

        {/* Drop shadow - canonical _showcaseSlideInnerDropShadow_gjbqq_177 */}
        {!isCenter && (
          <motion.div
            className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none"
            initial={{ x: 0, z: -150 }}
            style={{
              scale: 1.2,
              background: "rgba(0, 0, 0, 0.6)",
              filter: "blur(12px)",
              x: smoothShadowX,
              z: -150,
            }}
          />
        )}

        {/* Inset shadow - canonical _showcaseSlideInnerInsetShadow_gjbqq_188 */}
        {!isCenter && (
          <motion.div
            className="absolute top-0 right-0 w-full h-full z-10 pointer-events-none"
            style={{
              background: `radial-gradient(farthest-corner at 75% 75%, rgb(0,0,0) 0%, rgba(0,0,0,0.8) 10%, rgba(0,0,0,0.2) 100%),
                          linear-gradient(to top, rgb(0,0,0) 0%, rgb(0,0,0) 30%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0) 80%)`,
              backgroundRepeat: "no-repeat",
              opacity: smoothInsetOpacity,
            }}
            initial={{ opacity: isCenter ? 0 : 1 }}
          />
        )}
      </motion.div>
    </motion.div>
  );
});
