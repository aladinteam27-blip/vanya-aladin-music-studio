import { memo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, ChevronDown } from 'lucide-react';
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
  const [visibleCount, setVisibleCount] = useState(2);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Mobile: 4 blocks, Desktop: 2 blocks
      setVisibleCount(mobile ? 4 : 2);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visibleTracks = tracks.slice(0, visibleCount);
  const hasMore = visibleCount < tracks.length;

  const handleShowMore = () => {
    const increment = isMobile ? 4 : 2;
    setVisibleCount(prev => Math.min(prev + increment, tracks.length));
  };

  return (
    <section className="py-12 md:py-20 bg-cream">
      <div className="container mx-auto px-4 md:px-6">
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

        {/* Grid View - 2 columns on both mobile and desktop */}
        {viewMode === 'grid' && (
          <div className={cn(
            "grid gap-3 md:gap-6",
            isMobile 
              ? "grid-cols-2" 
              : "grid-cols-2 max-w-3xl mx-auto"
          )}>
            {visibleTracks.map((track, index) => (
              <GridCard 
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
          <div className="space-y-3 max-w-3xl mx-auto">
            {visibleTracks.map((track, index) => (
              <ListItem 
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
          <div className="flex justify-center mt-8">
            <button
              onClick={handleShowMore}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-full',
                'bg-charcoal text-warm-white',
                'text-sm font-medium',
                'transition-all duration-200',
                'hover:bg-charcoal-light hover:scale-105',
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

// Grid Card Component - Compact, neat sizing
interface CardProps {
  track: Track;
  index: number;
  isMobile?: boolean;
  onClick?: () => void;
}

const GridCard = memo(function GridCard({ track, index, isMobile, onClick }: CardProps) {
  return (
    <Link
      to={`/music/${track.slug}`}
      className="music-card group block"
      style={{ 
        animationName: 'fadeInUp',
        animationDuration: '0.4s',
        animationDelay: `${index * 80}ms`,
        animationFillMode: 'both',
        animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Cover with hover animation */}
      <div className={cn(
        "overflow-hidden rounded-lg bg-muted",
        isMobile ? "aspect-square" : "aspect-square"
      )}>
        <img
          src={track.coverUrl}
          alt={`Обложка трека "${track.title}" - ${track.format} ${track.year} года, исполнитель Ваня Аладин`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
  );
});

// List Item Component
const ListItem = memo(function ListItem({ track, index, onClick }: CardProps) {
  return (
    <Link
      to={`/music/${track.slug}`}
      className={cn(
        'flex items-center gap-4 p-3 md:p-4 rounded-lg',
        'bg-card hover:bg-accent transition-colors duration-200'
      )}
      style={{ 
        animationName: 'fadeInUp',
        animationDuration: '0.3s',
        animationDelay: `${index * 60}ms`,
        animationFillMode: 'both',
        animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)'
      }}
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
  );
});