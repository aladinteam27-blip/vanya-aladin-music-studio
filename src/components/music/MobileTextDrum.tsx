import { memo, useEffect, useRef } from "react";
import { motion, MotionValue, animate } from "framer-motion";

import { cn } from "@/lib/utils";
import type { Track } from "@/data/tracks";

interface MobileTextDrumProps {
  tracks: Track[];
  currentIndex: number;
  onSelect: (index: number) => void;
  offset: MotionValue<number>;
}

// Canonical mobile nav - _mobileNav_gjbqq_202
export const MobileTextDrum = memo(function MobileTextDrum({
  tracks,
  currentIndex,
  onSelect,
}: MobileTextDrumProps) {
  const navRef = useRef<HTMLElement>(null);

  // Canonical auto-scroll to active item
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    nav.style.setProperty("scroll-snap-type", "none");

    const activeItem = nav.querySelector(`.nav-item:nth-of-type(${currentIndex + 1})`) as HTMLElement;
    if (!activeItem) return;

    const rect = activeItem.getBoundingClientRect();
    const targetScroll = rect.left + rect.width / 2 - window.innerWidth / 2 + nav.scrollLeft;

    const animation = animate(nav.scrollLeft, targetScroll, {
      duration: 0.5,
      onUpdate: (v) => { nav.scrollLeft = v; },
      onComplete: () => {
        nav.style.setProperty("scroll-snap-type", "x mandatory");
      },
    });

    return () => animation.stop();
  }, [currentIndex]);

  return (
    <nav
      ref={navRef}
      className="absolute left-0 w-screen z-20 overflow-x-hidden hide-scrollbar"
      style={{
        // Canonical position: top: calc((var(--config-canvas-height) - var(--config-slide-size)) / 4)
        // Transform: translateY(100%) to position below the title area
        top: "calc((90svh - min(calc(100vw - 80px), calc(90svh - 20vh))) / 4)",
        transform: "translateY(100%)",
        // Canonical mask - _mobileNav_gjbqq_202
        WebkitMaskImage: "linear-gradient(to right, transparent 0, transparent 40px, black 30%, black 60%, transparent calc(100% - 40px), transparent 100%)",
        maskImage: "linear-gradient(to right, transparent 0, transparent 40px, black 30%, black 60%, transparent calc(100% - 40px), transparent 100%)",
        scrollSnapType: "x mandatory",
      }}
    >
      {/* Canonical nav list - _navList_gjbqq_219 */}
      <ul
        className="inline-flex list-none"
        style={{
          gap: 32, // Canonical gap: 32px
          padding: "0 calc(100vw - 50%)", // Canonical padding
        }}
      >
        {tracks.map((track, index) => {
          const isActive = index === currentIndex;

          return (
            <motion.li
              key={track.id}
              className={cn(
                "nav-item whitespace-nowrap relative",
                // Canonical font: font-family: ABC ROM, Helvetica, Arial, sans-serif
                // font-size: 14px, line-height: 1.2, font-weight: 400
                "font-sans text-sm font-normal leading-tight",
                "text-foreground"
              )}
              style={{
                scrollSnapAlign: "center",
                padding: "4px 0", // Canonical padding: 4px 0
              }}
              initial={{ opacity: isActive ? 1 : 0.4 }}
              animate={{ opacity: isActive ? 1 : 0.4 }}
              transition={{ duration: 0.3 }}
              onClick={() => onSelect(index)}
            >
              {track.title}
              
              {/* Canonical active border - _navItemActive_gjbqq_232:before */}
              {isActive && (
                <span
                  className="absolute border border-current rounded"
                  style={{
                    top: 0,
                    right: -8,
                    bottom: 0,
                    left: -8,
                    borderRadius: 4, // Canonical: border-radius: 4px
                  }}
                />
              )}
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
});
