import { memo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, ChevronDown } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Track } from '@/data/tracks';
import { cn } from '@/lib/utils';

interface MusicGridProps {
  tracks: Track[];
  onTrackClick?: (track: Track, index: number) => void;
}

type ViewMode = 'grid' | 'list';

export const MusicGrid = memo(function MusicGrid({ 
  tracks,
  onTrackClick 
}: MusicGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 4 : 4;
    }
    return 4;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visibleTracks = tracks.slice(0, visibleCount);
  const hasMore = visibleCount < tracks.length;

  const handleShowMore = () => {
    const increment = isMobile ? 4 : 4;
    setVisibleCount(prev => Math.min(prev + increment, tracks.length));
  };

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-[1660px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Вся музыка
          </h2>

          {/* View Toggle */}
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('view-toggle-btn', viewMode === 'grid' && 'active')}
              aria-label="Вид сетка"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('view-toggle-btn', viewMode === 'list' && 'active')}
              aria-label="Вид список"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Grid View - CANONICAL: 3 cols desktop, 2 cols mobile, centered, scroll entrance */}
        {viewMode === 'grid' && (
          <div className={cn(
            "grid gap-4 md:gap-6 mx-auto",
            isMobile 
              ? "grid-cols-2 max-w-lg" 
              : "grid-cols-3 max-w-4xl"
          )}>
            {visibleTracks.map((track, index) => (
              <ScrollRevealCard 
                key={track.id} 
                track={track} 
                index={index}
                isMobile={isMobile}
                onClick={() => onTrackClick?.(track, index)}
              />
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3 max-w-4xl">
            {visibleTracks.map((track, index) => (
              <ScrollRevealListItem 
                key={track.id} 
                track={track} 
                index={index}
                onClick={() => onTrackClick?.(track, index)}
              />
            ))}
          </div>
        )}

        {/* Show More Button */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleShowMore}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-full',
                'bg-foreground text-background',
                'text-sm font-medium',
                'transition-all duration-200',
                'hover:opacity-90 hover:scale-105',
                'active:scale-95'
              )}
            >
              Ещё
              <ChevronDown size={14} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
});

// CANONICAL: Scroll-triggered card with press-in effect
interface CardProps {
  track: Track;
  index: number;
  isMobile?: boolean;
  onClick?: () => void;
}

const ScrollRevealCard = memo(function ScrollRevealCard({ track, index, isMobile, onClick }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: (index % 4) * 0.08,
      }}
    >
      <Link
        to={`/music/${track.slug}`}
        className={cn(
          "group block transition-all duration-200",
          // CANONICAL: Press-in effect on desktop hover
          !isMobile && "hover:scale-[0.97] active:scale-95"
        )}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Cover - square with soft rounded corners */}
        <div className="overflow-hidden rounded-lg bg-muted aspect-square transition-shadow duration-200 group-hover:shadow-md">
          <img
            src={track.coverUrl}
            alt={`Обложка трека "${track.title}" - ${track.format} ${track.year} года, исполнитель Ваня Аладин`}
            className="w-full h-full object-cover transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="p-2 md:p-3">
          <h3 className="font-medium text-foreground truncate text-sm md:text-base">
            {track.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {track.format} · {track.year}
          </p>
        </div>
      </Link>
    </motion.div>
  );
});

// CANONICAL: Scroll-triggered list item
const ScrollRevealListItem = memo(function ScrollRevealListItem({ track, index, onClick }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: index * 0.05,
      }}
    >
      <Link
        to={`/music/${track.slug}`}
        className={cn(
          'flex items-center gap-4 p-3 md:p-4 rounded-lg',
          'bg-card hover:bg-accent transition-all duration-200',
          'hover:scale-[0.99] active:scale-[0.98]'
        )}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Cover */}
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
          <img
            src={track.coverUrl}
            alt={`Обложка трека "${track.title}" - ${track.format} ${track.year} года, исполнитель Ваня Аладин`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm md:text-base truncate">
            {track.title}
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {track.format} · {track.year}
          </p>
        </div>
      </Link>
    </motion.div>
  );
});
