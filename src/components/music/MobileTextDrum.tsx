import { memo } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";
import type { Track } from "@/data/tracks";

const springConfig = { stiffness: 100, damping: 30 };

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
  // Horizontal offset synchronized with cover drag
  const x = useTransform(offset, (v) => v * 0.35);

  // Show only nearby tracks
  const visibleRange = 2;
  const visible = tracks
    .map((_, i) => i)
    .filter((i) => Math.abs(i - currentIndex) <= visibleRange);

  return (
    // Position: at ~28% from top, like Lady Gaga reference - title is ABOVE the cover
    <div
      className="absolute left-0 right-0 top-[28%] z-[60] flex items-center justify-center pointer-events-none overflow-hidden"
      style={{ transform: "translateY(-100%)" }}
      aria-label="Track selector"
    >
      <motion.div
        className="flex items-center justify-center gap-5 px-4"
        style={{ x }}
      >
        {visible.map((index) => {
          const diff = index - currentIndex;
          const isActive = diff === 0;

          return (
            <motion.button
              key={tracks[index].id}
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "pointer-events-auto select-none whitespace-nowrap",
                "text-sm font-medium tracking-wide",
                isActive
                  ? "text-foreground border border-foreground/60 px-4 py-1.5 rounded-sm"
                  : "text-foreground/35 px-3 py-1.5",
              )}
              animate={{
                opacity: isActive ? 1 : 0.4,
                scale: isActive ? 1 : 0.85,
              }}
              transition={{ type: "spring", ...springConfig }}
            >
              {tracks[index].title}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
});
