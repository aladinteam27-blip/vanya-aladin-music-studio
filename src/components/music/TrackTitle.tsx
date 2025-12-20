import { memo, useState, useEffect, useRef } from 'react';
import { Track } from '@/data/tracks';
import { cn } from '@/lib/utils';

interface TrackTitleProps {
  track: Track;
  isTransitioning?: boolean;
}

export const TrackTitle = memo(function TrackTitle({ 
  track, 
  isTransitioning = false 
}: TrackTitleProps) {
  const [displayTrack, setDisplayTrack] = useState(track);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTrackRef = useRef(track);

  useEffect(() => {
    if (prevTrackRef.current.id !== track.id) {
      setIsAnimating(true);
      
      // Wait for fade out, then update
      const timer = setTimeout(() => {
        setDisplayTrack(track);
        setIsAnimating(false);
      }, 200);

      prevTrackRef.current = track;
      return () => clearTimeout(timer);
    }
  }, [track]);

  return (
    <div className="relative h-20 flex flex-col items-center justify-center overflow-hidden">
      <div
        className={cn(
          'text-center transition-all duration-300 ease-out',
          isAnimating && 'opacity-0 transform translate-y-2'
        )}
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
          {displayTrack.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {displayTrack.format} · {displayTrack.year}
        </p>
      </div>
    </div>
  );
});
