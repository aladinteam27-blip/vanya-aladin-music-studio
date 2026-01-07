import { memo, useEffect, useRef } from "react";
import { motion, MotionValue, useTransform, animate } from "framer-motion";

import { cn } from "@/lib/utils";
import type { Track } from "@/data/tracks";

interface MobileTextDrumProps {
  tracks: Track[];
  currentIndex: number;
  onSelect: (index: number) => void;
  offset: MotionValue<number>;
}

export const MobileTextDrum = memo(function MobileTextDrum({
  tracks,
  currentIndex,
  onSelect,
  offset,
}: MobileTextDrumProps) {
  const navRef = useRef<HTMLElement>(null);

  // Auto-scroll to active item - canonical behavior
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    nav.style.setProperty("scroll-snap-type", "none");

    const activeItem = nav.querySelector(`.nav-item:nth-of-type(${currentIndex + 1})`);
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
        // Position: canonical - at 1/4 from top of canvas, below title
        top: "calc((90svh - min(calc(100vw - 80px), calc(90svh - 20vh))) / 4)",
        transform: "translateY(100%)",
        scrollSnapType: "x mandatory",
        // Gradient mask on edges - canonical
        maskImage: "linear-gradient(to right, transparent 0, transparent 40px, black 30%, black 60%, transparent calc(100% - 40px), transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0, transparent 40px, black 30%, black 60%, transparent calc(100% - 40px), transparent 100%)",
      }}
    >
      <ul
        className="inline-flex list-none gap-8"
        style={{ padding: "0 calc(100vw - 50%)" }}
      >
        {tracks.map((track, index) => {
          const isActive = index === currentIndex;

          return (
            <motion.li
              key={track.id}
              className={cn(
                "nav-item scroll-snap-center whitespace-nowrap relative py-1",
                "text-sm font-normal text-foreground",
                "font-sans tracking-wide"
              )}
              style={{ scrollSnapAlign: "center" }}
              initial={{ opacity: isActive ? 1 : 0.4 }}
              animate={{ opacity: isActive ? 1 : 0.4 }}
              transition={{ duration: 0.3 }}
              onClick={() => onSelect(index)}
            >
              {track.title}
              {/* Active border frame - canonical */}
              {isActive && (
                <span
                  className="absolute inset-0 border border-current rounded"
                  style={{
                    top: 0,
                    right: -8,
                    bottom: 0,
                    left: -8,
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
