import { memo, useCallback } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";
import type { Track } from "@/data/tracks";

const springConfig = { stiffness: 100, damping: 30 };

function clampIndex(index: number, max: number) {
  return Math.max(0, Math.min(max, index));
}

function getVisibleIndices(currentIndex: number, total: number, radius = 2) {
  const indices: number[] = [];
  for (let i = currentIndex - radius; i <= currentIndex + radius; i++) {
    if (i >= 0 && i < total) indices.push(i);
  }
  return indices;
}

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
  const y = useTransform(offset, (v) => v * 0.7);
  const visible = getVisibleIndices(currentIndex, tracks.length, 2);

  // Visually matches the “drum” behavior: centered item is framed, neighbors fade.
  const itemH = 52;

  return (
    <motion.div
      className="absolute left-0 right-0 top-[14vh] z-[60] flex items-center justify-center pointer-events-none"
      style={{ y }}
      aria-label="Track selector"
    >
      <div className="relative h-[220px] w-full max-w-[92vw]">
        {visible.map((index) => {
          const diff = index - currentIndex;
          const isActive = diff === 0;
          const opacity = isActive ? 1 : Math.max(0.2, 0.55 - Math.abs(diff) * 0.18);
          const scale = isActive ? 1 : 0.86;

          return (
            <motion.button
              key={tracks[index].id}
              type="button"
              onClick={() => onSelect(clampIndex(index, tracks.length - 1))}
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                "pointer-events-auto select-none whitespace-nowrap",
                "text-base font-semibold text-foreground",
                isActive
                  ? "border border-foreground/60 px-6 py-2"
                  : "border border-transparent px-6 py-2",
              )}
              animate={{ y: diff * itemH, opacity, scale }}
              transition={{ type: "spring", ...springConfig }}
            >
              {tracks[index].title}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
});
