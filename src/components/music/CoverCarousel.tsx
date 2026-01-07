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

// Canonical spring configs from Lady Gaga reference
const springConfig = { stiffness: 400, mass: 0.1, damping: 20 };
const hoverSpring = { stiffness: 100, mass: 0.1, damping: 20 };
const snapSpring = { stiffness: 300, damping: 35 };

// CSS variables from canonical source
const CONFIG = {
  // Desktop
  desktop: {
    slideGridSize: 4,
    nextSlideColumnOffset: 4,
    nextSlideRowOffset: 2,
    slideGap: 48,
    canvasHeight: "100vh",
    // Slide size: max(30vw, calc(100vh - 30vh))
    getSlideSize: (vw: number, vh: number) => Math.max(vw * 0.3, vh * 0.7),
  },
  // Mobile
  mobile: {
    slideGridSize: 4,
    nextSlideColumnOffset: 3,
    nextSlideRowOffset: 2,
    slideGap: 28,
    canvasHeight: "90svh",
    // Slide size: min(100vw - 80px, 90svh - 20vh)
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
  const [viewportW, setViewportW] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 375,
  );
  const [viewportH, setViewportH] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerHeight : 667,
  );

  const config = isMobile ? CONFIG.mobile : CONFIG.desktop;
  const slideSize = config.getSlideSize(viewportW, viewportH);

  // Motion values for scroll-based progress
  const scrollProgress = useMotionValue(0);
  const scrollVelocity = useMotionValue(0);
  const smoothProgress = useSpring(scrollProgress, springConfig);
  const smoothVelocity = useSpring(scrollVelocity, springConfig);

  // 3D rotation for center cover on hover (Desktop)
  const hoverTiltX = useMotionValue(0);
  const hoverTiltY = useMotionValue(0);

  // Mobile gesture offsets
  const dragOffset = useMotionValue(0);
  const textDrumOffset = useMotionValue(0);
  const swipeRef = useRef<SwipeState | null>(null);

  // Canvas transforms - canonical diagonal movement
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

  // Update scroll progress based on currentIndex
  useEffect(() => {
    const progress = currentIndex / Math.max(1, tracks.length - 1);
    animate(scrollProgress, progress, { duration: 0.3 * Math.abs(scrollProgress.get() - progress) + 0.2 });
  }, [currentIndex, tracks.length, scrollProgress]);

  // Desktop: Mouse move handler - hover tilt like canonical
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
      onIndexChange(index);
      onTrackChange?.(tracks[index]);
    },
    [tracks, onIndexChange, onTrackChange],
  );

  // Mobile: custom HORIZONTAL swipe
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

  const handlePointerUp = useCallback(() => {
    finishSwipe();
  }, [finishSwipe]);

  const handlePointerCancel = useCallback(() => {
    finishSwipe();
  }, [finishSwipe]);

  // Slider handler
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      const newIndex = Math.round(value * (tracks.length - 1));
      if (newIndex !== currentIndex) {
        onIndexChange(newIndex);
        onTrackChange?.(tracks[newIndex]);
      }
    },
    [tracks, currentIndex, onIndexChange, onTrackChange],
  );

  // Slider drag handlers for smooth snap behavior
  const handleSliderDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleSliderDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Calculate transform for each cover - canonical diagonal stack
  const getCoverTransform = useCallback(
    (slideIndex: number) => {
      const diff = slideIndex - currentIndex;
      const absPos = Math.abs(diff);
      const isCenter = diff === 0;
      const isPrev = diff < 0;
      const isNext = diff > 0;

      // Velocity-based transforms from canonical source
      const velocityRange = isMobile ? 80 : 1000;

      // rotateY: velocity-based or hover-based for center
      const baseRotateY = isCenter ? 0 : diff * (isMobile ? -5 : -35);

      // Opacity: darken non-active slides
      const insetOpacity = isCenter ? 0 : isPrev ? (isMobile ? 0.5 : 0.8) : 0.5;

      // Scale: slight scale on velocity
      const scale = isCenter ? 1 : 1.1;

      // Drop shadow X offset
      const shadowX = isCenter ? 0 : isNext ? -40 : 30;

      // Canvas X offset for depth
      const depthOffset = isMobile
        ? (isNext ? -80 : 0)
        : (diff * (500 / (tracks.length / 2)));

      return {
        slideIndex,
        diff,
        absPos,
        isCenter,
        isPrev,
        isNext,
        baseRotateY,
        insetOpacity,
        scale,
        shadowX,
        depthOffset,
        zIndex: tracks.length - slideIndex,
      };
    },
    [currentIndex, isMobile, tracks.length],
  );

  // Calculate grid position for each slide
  const getGridPosition = (slideIndex: number) => {
    const gridRow = slideIndex * config.nextSlideRowOffset + 1;
    const gridColumn = slideIndex * config.nextSlideColumnOffset + 1;
    return {
      gridRow: `${gridRow} / span ${config.slideGridSize}`,
      gridColumn: `${gridColumn} / span ${config.slideGridSize}`,
    };
  };

  // CSS variables for the canvas grid
  const cssVars = {
    "--dynamic-number-of-slides": tracks.length,
    "--dynamic-active-slide-index": currentIndex,
    "--config-slide-grid-size": config.slideGridSize,
    "--config-next-slide-colum-offset": config.nextSlideColumnOffset,
    "--config-next-slide-row-offset": config.nextSlideRowOffset,
    "--config-slide-gap": `${config.slideGap}px`,
    "--config-slide-size": `${slideSize}px`,
    "--config-canvas-height": config.canvasHeight,
  } as React.CSSProperties;

  // Grid template calculations
  const gridCols = tracks.length * config.slideGridSize - (tracks.length - 1) * (config.nextSlideColumnOffset - config.slideGridSize) * -1;
  const gridRows = tracks.length * config.slideGridSize - (tracks.length - 1) * (config.nextSlideRowOffset - config.slideGridSize) * -1;
  const cellSize = (slideSize - config.slideGap * (config.slideGridSize - 1)) / config.slideGridSize;
  const nonActiveSpaceW = (viewportW - slideSize) / 2;
  const nonActiveSpaceH = (viewportH * (isMobile ? 0.9 : 1) - slideSize) / 2;

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
      {/* Left gradient mask - canonical */}
      <div
        className="absolute top-0 left-0 h-full z-10 pointer-events-none"
        style={{
          width: nonActiveSpaceW,
          background: isMobile
            ? "linear-gradient(to right, hsl(var(--background)), hsl(var(--background) / 0.3) 40%, transparent)"
            : "linear-gradient(to right, hsl(var(--background)), hsl(var(--background)) 20%, hsl(var(--background) / 0.5) 80%, transparent)",
        }}
      />

      {/* Desktop: Track names sidebar - canonical position */}
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
                  className={cn(
                    "text-left px-4 py-2 text-sm font-medium transition-colors duration-300",
                    isActive
                      ? "text-foreground"
                      : "text-foreground/30 hover:text-foreground/60",
                  )}
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

      {/* Mobile: drum text - canonical position at top */}
      {isMobile && (
        <MobileTextDrum
          tracks={tracks}
          currentIndex={currentIndex}
          onSelect={handleTrackClick}
          offset={textDrumOffset}
        />
      )}

      {/* Canvas wrapper - stacked grids */}
      <div className="grid" style={{ display: "grid" }}>
        {/* Visible canvas - actual covers with 3D transforms */}
        <div
          className="overflow-hidden"
          style={{ gridColumn: "1/1", gridRow: "1/1", width: "100%", height: config.canvasHeight }}
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
                const transform = getCoverTransform(slideIndex);
                const gridPos = getGridPosition(slideIndex);
                const entranceDelay = slideIndex * 0.06;

                // Velocity-based rotateY for non-center slides
                const rotateYValue = transform.isCenter
                  ? useTransform(hoverTiltX, [-0.5, 0.5], [-8, 8])
                  : transform.baseRotateY;

                // Velocity-based rotateX for center
                const rotateXValue = transform.isCenter
                  ? useTransform(hoverTiltY, [-0.5, 0.5], [8, -8])
                  : 0;

                return (
                  <motion.li
                    key={track.id}
                    className="relative"
                    style={{
                      ...gridPos,
                      zIndex: transform.zIndex,
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
                    <motion.div
                      style={{
                        x: transform.depthOffset,
                        perspective: "100vw",
                      }}
                    >
                      <motion.div
                        className="relative"
                        style={{
                          transformStyle: "preserve-3d",
                          rotateY: transform.isCenter ? rotateYValue : transform.baseRotateY,
                          rotateX: transform.isCenter ? rotateXValue : 0,
                        }}
                        animate={{
                          scale: transform.isCenter && isPressed ? 0.95 : 1,
                        }}
                        transition={{ type: "spring", ...hoverSpring }}
                        onMouseDown={() => transform.isCenter && setIsPressed(true)}
                        onMouseUp={() => setIsPressed(false)}
                        onMouseLeave={() => setIsPressed(false)}
                        onClick={() => !transform.isCenter && handleTrackClick(slideIndex)}
                      >
                        {/* Cover image */}
                        <div
                          className={cn(
                            "overflow-hidden rounded flex-shrink-0",
                            transform.isCenter ? "cursor-default" : "cursor-pointer",
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

                        {/* 3D edge border - canonical */}
                        <div
                          className="absolute top-0 right-[-4px] w-[4px] h-full"
                          style={{
                            transform: "rotateY(90deg)",
                            transformOrigin: "left",
                            background: "var(--dynamic-color)",
                          }}
                        />

                        {/* Drop shadow - canonical */}
                        {!transform.isCenter && (
                          <motion.div
                            className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none"
                            style={{
                              scale: 1.2,
                              background: "rgba(0, 0, 0, 0.5)",
                              filter: "blur(12px)",
                              x: transform.shadowX,
                              z: -150,
                            }}
                          />
                        )}

                        {/* Inset shadow overlay for non-active - canonical */}
                        {!transform.isCenter && (
                          <motion.div
                            className="absolute top-0 right-0 w-full h-full z-10 pointer-events-none"
                            style={{
                              background: `radial-gradient(farthest-corner at 75% 75%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 10%, rgba(0,0,0,0.2) 100%),
                                          linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.5) 60%, transparent 80%)`,
                            }}
                            initial={{ opacity: 1 }}
                            animate={{ opacity: transform.insetOpacity }}
                            transition={{ type: "spring", ...hoverSpring }}
                          />
                        )}
                      </motion.div>
                    </motion.div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </motion.ul>
        </div>

        {/* Orchestrator canvas - invisible scroll snap container */}
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
                  className={cn(
                    "scroll-snap-center",
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

      {/* Bottom progress indicator - canonical */}
      <div
        className="absolute z-10 overflow-hidden left-1/2 -translate-x-1/2"
        style={{
          bottom: `calc((${config.canvasHeight} - ${slideSize}px) / 4)`,
          width: isMobile ? "calc(100vw - 32px)" : slideSize,
        }}
      >
        <div className="relative w-full h-8">
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[1px] left-0 w-full"
            style={{ background: "hsl(var(--foreground) / 0.3)" }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full cursor-grab active:cursor-grabbing"
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
            onChange={handleSliderChange}
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
