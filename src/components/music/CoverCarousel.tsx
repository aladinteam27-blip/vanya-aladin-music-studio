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

// Spring config - viscous, expensive like the reference
const springConfig = { stiffness: 100, damping: 30 };
const snapSpring = { stiffness: 300, damping: 35 };

type SwipeState = {
  startY: number;
  lastY: number;
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
  const isMobile = useIsMobile();

  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewportW, setViewportW] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 375,
  );

  // Motion values for mouse tracking (Desktop)
  const sceneX = useSpring(0, springConfig);
  const sceneY = useSpring(0, springConfig);

  // 3D rotation for center cover on hover (Desktop)
  const rotateY = useSpring(0, springConfig);
  const rotateX = useSpring(0, springConfig);

  // Mobile gesture offsets (custom pointer logic; no framer drag -> page scroll stays available)
  const dragOffset = useMotionValue(0);
  const textDrumOffset = useMotionValue(0);
  const swipeRef = useRef<SwipeState | null>(null);

  const mobileSceneY = useTransform(dragOffset, (y) => y * 0.35);

  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    onResize();

    const timer = setTimeout(() => setIsLoaded(true), 120);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, []);

  // Desktop: Mouse move handler - scene follows cursor (camera-like)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile || isDragging) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const normalizedX = (e.clientX - rect.left - centerX) / centerX;
      const normalizedY = (e.clientY - rect.top - centerY) / centerY;

      // Expansive movement
      sceneX.set(-normalizedX * 180);
      sceneY.set(-normalizedY * 140);

      // Subtle tilt on the active cover
      rotateY.set(-normalizedX * 15);
      rotateX.set(normalizedY * 10);
    },
    [isMobile, isDragging, sceneX, sceneY, rotateY, rotateX],
  );

  const handleMouseLeave = useCallback(() => {
    sceneX.set(0);
    sceneY.set(0);
    rotateY.set(0);
    rotateX.set(0);
  }, [sceneX, sceneY, rotateY, rotateX]);

  const handleTrackClick = useCallback(
    (index: number) => {
      onIndexChange(index);
      onTrackChange?.(tracks[index]);
    },
    [tracks, onIndexChange, onTrackChange],
  );

  // Mobile: custom swipe without blocking page scroll
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isMobile) return;
      swipeRef.current = {
        startY: e.clientY,
        lastY: e.clientY,
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
      s.lastY = e.clientY;
      s.lastT = now;

      const dy = e.clientY - s.startY;
      dragOffset.set(dy);
      textDrumOffset.set(dy);
    },
    [isMobile, dragOffset, textDrumOffset],
  );

  const finishSwipe = useCallback(() => {
    if (!isMobile) return;
    const s = swipeRef.current;
    if (!s) return;

    swipeRef.current = null;
    setIsDragging(false);

    const dy = dragOffset.get();
    const dt = Math.max(1, s.lastT - s.startT);
    const vy = ((s.lastY - s.startY) / dt) * 1000;

    const threshold = 64;
    const velocityThreshold = 520;

    let newIndex = currentIndex;

    if (Math.abs(dy) > threshold || Math.abs(vy) > velocityThreshold) {
      if (dy > 0 || vy > velocityThreshold) {
        newIndex = Math.max(0, currentIndex - 1);
      } else {
        newIndex = Math.min(tracks.length - 1, currentIndex + 1);
      }
    }

    animate(dragOffset, 0, snapSpring);
    animate(textDrumOffset, 0, snapSpring);

    if (newIndex !== currentIndex) {
      onIndexChange(newIndex);
      onTrackChange?.(tracks[newIndex]);
    }
  }, [isMobile, currentIndex, tracks, dragOffset, textDrumOffset, onIndexChange, onTrackChange]);

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent) => {
      finishSwipe();
    },
    [finishSwipe],
  );

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

  const getCoverStyle = useCallback(
    (index: number) => {
      const diff = index - currentIndex;
      const absPos = Math.abs(diff);

      // Mobile: center cover ~90% width (as per reference)
      const mobileSize = Math.round(Math.min(viewportW * 0.9, 440));
      const desktopSize = 420;
      const size = isMobile ? mobileSize : desktopSize;

      const diagonalX = isMobile ? Math.round(size * 0.55) : 340;
      const diagonalY = isMobile ? Math.round(size * 0.65) : 320;
      const zStep = isMobile ? 260 : 340;
      const centerZ = isMobile ? 180 : 120;

      return {
        size,
        diff,
        absPos,
        isCenter: diff === 0,

        // Hierarchy
        zIndex: 80 - absPos * 10,
        opacity: diff === 0 ? 1 : Math.max(0.18, 0.55 - absPos * 0.18),
        scale: diff === 0 ? 1 : Math.max(0.58, 0.82 - absPos * 0.14),

        // Spatial composition (clear diagonal + depth)
        offsetX: diff * diagonalX,
        offsetY: diff * diagonalY,
        translateZ: diff === 0 ? centerZ : -absPos * zStep,

        // Base 3D orientation for side covers
        baseRotateY: diff === 0 ? 0 : diff * -16,
        baseRotateX: diff === 0 ? 0 : diff * 6,
      };
    },
    [currentIndex, isMobile, viewportW],
  );

  return (
    <section
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-background"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      // Important: keep page scroll working on mobile.
      style={{ touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Desktop: Track names sidebar */}
      {!isMobile && (
        <nav className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 z-[60] flex flex-col gap-0.5">
          {tracks.map((track, index) => {
            const isActive = index === currentIndex;
            return (
              <motion.button
                key={track.id}
                onClick={() => handleTrackClick(index)}
                className={cn(
                  "text-left px-4 py-2 text-sm font-medium transition-colors duration-300",
                  isActive
                    ? "text-foreground border border-foreground/40"
                    : "text-foreground/30 hover:text-foreground/60 border border-transparent",
                )}
                animate={{ opacity: isActive ? 1 : 0.5 }}
                transition={{ duration: 0.3 }}
              >
                {track.title}
              </motion.button>
            );
          })}
        </nav>
      )}

      {/* Mobile: drum text (integrated UI; no overlapping button grid) */}
      {isMobile && (
        <MobileTextDrum
          tracks={tracks}
          currentIndex={currentIndex}
          onSelect={handleTrackClick}
          offset={textDrumOffset}
        />
      )}

      {/* 3D Scene */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: "1200px", perspectiveOrigin: "center center" }}
      >
        <motion.div
          className="relative"
          style={{
            width: isMobile ? "120vw" : "200vw",
            height: isMobile ? "120vh" : "150vh",
            transformStyle: "preserve-3d",
            x: isMobile ? 0 : sceneX,
            y: isMobile ? mobileSceneY : sceneY,
          }}
        >
          <AnimatePresence mode="sync">
            {tracks.map((track, index) => {
              // Mobile: keep scene readable (no “pile”)
              if (isMobile && Math.abs(index - currentIndex) > 3) return null;

              const style = getCoverStyle(index);
              const entranceDelay = index * 0.06;

              return (
                <motion.div
                  key={track.id}
                  className={cn(
                    "absolute",
                    style.isCenter ? "cursor-default" : "cursor-pointer",
                  )}
                  style={{
                    width: style.size,
                    height: style.size,
                    left: "50%",
                    top: isMobile ? "58%" : "50%",
                    marginLeft: -style.size / 2,
                    marginTop: -style.size / 2,
                    zIndex: style.zIndex,
                    transformStyle: "preserve-3d",
                  }}
                  initial={isLoaded ? false : {
                    opacity: 0,
                    scale: 0.5,
                    z: -600,
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
                    type: "spring",
                    ...springConfig,
                    delay: isLoaded ? 0 : entranceDelay,
                  }}
                  onClick={() => !style.isCenter && handleTrackClick(index)}
                  onMouseDown={() => style.isCenter && setIsPressed(true)}
                  onMouseUp={() => setIsPressed(false)}
                  onMouseLeave={() => setIsPressed(false)}
                >
                  <motion.div
                    className="w-full h-full relative"
                    style={{
                      transformStyle: "preserve-3d",
                      rotateY:
                        style.isCenter && !isMobile ? rotateY : style.baseRotateY,
                      rotateX:
                        style.isCenter && !isMobile ? rotateX : style.baseRotateX,
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        boxShadow: style.isCenter
                          ? "0 60px 120px -30px hsl(var(--foreground) / 0.30), 0 40px 80px -30px hsl(var(--foreground) / 0.22)"
                          : style.diff < 0
                            ? "18px 22px 60px hsl(var(--foreground) / 0.18), 10px 10px 30px hsl(var(--foreground) / 0.14)"
                            : "-10px 50px 100px hsl(var(--foreground) / 0.20)",
                      }}
                    />

                    <img
                      src={track.coverUrl}
                      alt={`${track.title} - ${track.format} ${track.year}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                      style={{ aspectRatio: "1/1" }}
                    />

                    {!style.isCenter && (
                      <div
                        className="absolute inset-0 pointer-events-none bg-foreground/30"
                        style={{ opacity: 0.25 + style.absPos * 0.18 }}
                      />
                    )}

                    {style.isCenter && (
                      <div className="absolute inset-0 pointer-events-none border border-foreground/10" />
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
        <div className="relative h-[2px] bg-foreground/15 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            animate={{ width: `${((currentIndex + 1) / tracks.length) * 100}%` }}
            transition={{ type: "spring", ...snapSpring }}
          />
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={currentIndex / Math.max(1, tracks.length - 1)}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-10 -mt-4 opacity-0 cursor-pointer"
          // Don’t block page scroll; slider only needs taps.
          style={{ touchAction: "pan-y" }}
        />

        <p className="text-center text-xs text-foreground/40 mt-4 font-medium tracking-wide">
          {currentIndex + 1} / {tracks.length}
        </p>
      </div>
    </section>
  );
});
