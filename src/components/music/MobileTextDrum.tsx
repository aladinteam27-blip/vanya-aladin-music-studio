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
  // Horizontal offset based on drag
  const x = useTransform(offset, (v) => v * 0.4);

  // Show only nearby tracks for performance
  const visibleRange = 2;
  const visible = tracks
    .map((_, i) => i)
    .filter((i) => Math.abs(i - currentIndex) <= visibleRange);

  return (
    <div
      className="absolute left-0 right-0 top-[18vh] z-[60] flex items-center justify-center pointer-events-none"
      aria-label="Track selector"
    >
      <motion.div
        className="flex items-center gap-4 px-4"
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
                "text-sm font-medium transition-colors",
                isActive
                  ? "text-foreground border border-foreground/60 px-4 py-1.5"
                  : "text-foreground/35 border border-transparent px-4 py-1.5",
              )}
              animate={{
                opacity: isActive ? 1 : 0.4,
                scale: isActive ? 1 : 0.9,
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
