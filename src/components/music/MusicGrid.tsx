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
  // Use a ref to persist visible count across re-renders
  const [visibleCount, setVisibleCount] = useState(() => {
    // Initialize based on window width
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 4 : 4;
    }
    return 4;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Don't reset visibleCount on resize - keep user's expanded state
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
    <section className="py-12 md:py-20 bg-cream">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
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

        {/* Grid View - 4 columns on mobile, 3-4 on desktop */}
        {viewMode === 'grid' && (
          <div className={cn(
            "grid gap-3 md:gap-5",
            isMobile 
              ? "grid-cols-2" 
              : "grid-cols-3 lg:grid-cols-4"
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
          <div className="space-y-3 max-w-4xl">
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
          <div className="flex justify-center mt-10">
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

// Grid Card Component - Square, press-in effect on desktop hover
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
      className={cn(
        "group block transition-all duration-200",
        // Press-in effect on desktop hover
        !isMobile && "hover:scale-[0.97] active:scale-95"
      )}
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
      {/* Cover - square with rounded corners */}
      <div className="overflow-hidden rounded-lg bg-muted aspect-square shadow-sm group-hover:shadow-md transition-shadow duration-200">
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
  );
});

// List Item Component
const ListItem = memo(function ListItem({ track, index, onClick }: CardProps) {
  return (
    <Link
      to={`/music/${track.slug}`}
      className={cn(
        'flex items-center gap-4 p-3 md:p-4 rounded-lg',
        'bg-card hover:bg-accent transition-all duration-200',
        'hover:scale-[0.99] active:scale-[0.98]'
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
