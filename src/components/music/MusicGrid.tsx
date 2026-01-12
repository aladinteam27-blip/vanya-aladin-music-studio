import { memo, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-[1660px]">
        {/* Header - CANONICAL: 3 cols centered */}
        <div className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Вся музыка
          </h2>

          {/* View Toggle - DARK THEME aware */}
          <div className="inline-flex items-center justify-center rounded-full bg-muted p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                viewMode === 'grid' 
                  ? 'bg-foreground text-background' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Вид сетка"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-all',
                viewMode === 'list' 
                  ? 'bg-foreground text-background' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
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
            {tracks.map((track, index) => (
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

        {/* List View - CANONICAL: centered */}
        {viewMode === 'list' && (
          <div className="space-y-3 max-w-4xl mx-auto">
            {tracks.map((track, index) => (
              <ScrollRevealListItem 
                key={track.id} 
                track={track} 
                index={index}
                onClick={() => onTrackClick?.(track, index)}
              />
            ))}
          </div>
        )}
        
        {/* No "More" button - removed per requirements */}
      </div>
    </section>
  );
});

// CANONICAL: Scroll-triggered card with Lady Gaga's soft tilt effect
interface CardProps {
  track: Track;
  index: number;
  isMobile?: boolean;
  onClick?: () => void;
}

const ScrollRevealCard = memo(function ScrollRevealCard({ track, index, isMobile, onClick }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  // CANONICAL: Same soft tilt as carousel center cover
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normalizedX = (x / rect.width - 0.5) * 8; // Same 8deg max as carousel
    const normalizedY = (y / rect.height - 0.5) * 8;
    setTiltX(-normalizedY);
    setTiltY(normalizedX);
  };

  const handleMouseLeave = () => {
    setTiltX(0);
    setTiltY(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: (index % 3) * 0.08, // Stagger per row of 3
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
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: "500px",
        }}
      >
        {/* Cover - square with soft rounded corners and CANONICAL tilt */}
        <motion.div 
          className="overflow-hidden rounded-lg bg-muted aspect-square transition-shadow duration-200 group-hover:shadow-lg"
          animate={{
            rotateX: tiltX,
            rotateY: tiltY,
          }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <img
            src={track.coverUrl}
            alt={`Обложка трека "${track.title}" - ${track.format} ${track.year} года, исполнитель Ваня Аладин`}
            className="w-full h-full object-cover transition-transform duration-300"
            loading="lazy"
          />
        </motion.div>
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
