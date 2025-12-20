import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List, ChevronDown } from 'lucide-react';
import { Track } from '@/data/tracks';
import { cn } from '@/lib/utils';

interface MusicGridProps {
  tracks: Track[];
  onTrackClick?: (track: Track, index: number) => void;
}

type ViewMode = 'grid' | 'list';

const INITIAL_VISIBLE_COUNT = 4;

export const MusicGrid = memo(function MusicGrid({ 
  tracks,
  onTrackClick 
}: MusicGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const visibleTracks = tracks.slice(0, visibleCount);
  const hasMore = visibleCount < tracks.length;

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + 4, tracks.length));
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

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
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

// Grid Card Component
interface CardProps {
  track: Track;
  index: number;
  onClick?: () => void;
}

const GridCard = memo(function GridCard({ track, index, onClick }: CardProps) {
  return (
    <Link
      to={`/music/${track.slug}`}
      className="music-card group block animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="aspect-square overflow-hidden rounded-xl bg-muted">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <h3 className="font-medium text-foreground truncate">
          {track.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
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
        'flex items-center gap-5 p-4 md:p-5 rounded-xl',
        'bg-card hover:bg-accent transition-colors duration-200',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Cover */}
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground text-base md:text-lg truncate">
          {track.title}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {track.format} · {track.year}
        </p>
      </div>
    </Link>
  );
});
