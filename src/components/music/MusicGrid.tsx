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
  
  // Desktop: 2 cards, Mobile: 4 cards initially
  const getInitialCount = () => isMobile ? 4 : 2;
  const [visibleCount, setVisibleCount] = useState(2);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
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
    <section className="py-16 md:py-24 bg-cream">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Вся музыка
          </h2>

          {/* View Toggle */}
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('view-toggle-btn', viewMode === 'grid' && 'active')}
              aria-label="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('view-toggle-btn', viewMode === 'list' && 'active')}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Grid View - 2 large cards on desktop, 2 columns mobile */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {visibleTracks.map((track, index) => (
              <GridCard 
                key={track.id} 
                track={track} 
                index={index}
                onClick={() => onTrackClick?.(track, index)}
              />
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
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
                'flex items-center gap-2 px-8 py-3 rounded-full',
                'bg-charcoal text-warm-white',
                'text-sm font-medium',
                'transition-all duration-200',
                'hover:bg-charcoal-light hover:scale-105',
                'active:scale-95'
              )}
            >
              Ещё
              <ChevronDown size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
});

// Grid Card Component - Large cards with animation
interface CardProps {
  track: Track;
  index: number;
  onClick?: () => void;
}

const GridCard = memo(function GridCard({ track, index, onClick }: CardProps) {
  return (
    <Link
      to={`/music/${track.slug}`}
      className="music-card group block"
      style={{ 
        animationName: 'fadeInUp',
        animationDuration: '0.5s',
        animationDelay: `${index * 100}ms`,
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
      {/* Cover with hover animation - rounded only here */}
      <div className="aspect-square overflow-hidden rounded-xl bg-muted">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-3 md:p-4">
        <h3 className="font-medium text-foreground truncate text-base md:text-lg">
          {track.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {track.format} · {track.year}
        </p>
      </div>
    </Link>
  );
});

// List Item Component - Larger with more padding
const ListItem = memo(function ListItem({ track, index, onClick }: CardProps) {
  return (
    <Link
      to={`/music/${track.slug}`}
      className={cn(
        'flex items-center gap-5 p-5 md:p-6 rounded-xl',
        'bg-card hover:bg-accent transition-colors duration-200'
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
      {/* Cover - rounded in collection */}
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground text-lg md:text-xl truncate">
          {track.title}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {track.format} · {track.year}
        </p>
      </div>
    </Link>
  );
});
