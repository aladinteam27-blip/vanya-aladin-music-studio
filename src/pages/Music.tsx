import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CoverCarousel } from '@/components/music/CoverCarousel';
import { TrackTitle } from '@/components/music/TrackTitle';
import { MiniPlayer } from '@/components/music/MiniPlayer';
import { MusicGrid } from '@/components/music/MusicGrid';
import { tracks, Track } from '@/data/tracks';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const MusicPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentTrack = tracks[currentIndex];
  
  const { 
    isPlaying, 
    currentTrack: playingTrack, 
    progress, 
    toggle, 
    stop 
  } = useAudioPlayer();

  // Handle index change from carousel
  const handleIndexChange = useCallback((index: number) => {
    // Stop current audio when swiping
    stop();
    setCurrentIndex(index);
  }, [stop]);

  // Handle track change
  const handleTrackChange = useCallback((track: Track) => {
    // Audio is stopped in handleIndexChange
  }, []);

  // Handle play toggle
  const handlePlayToggle = useCallback(() => {
    toggle(currentTrack);
  }, [toggle, currentTrack]);

  // Handle track click from grid
  const handleGridTrackClick = useCallback((track: Track, index: number) => {
    stop();
    setCurrentIndex(index);
    // Scroll to top to see the carousel
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stop]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Hero Section with Carousel */}
      <main className="pt-20">
        {/* Track Title */}
        <section className="pt-10 pb-4">
          <TrackTitle track={currentTrack} />
        </section>

        {/* Cover Carousel */}
        <section className="pb-10">
          <CoverCarousel
            tracks={tracks}
            currentIndex={currentIndex}
            onIndexChange={handleIndexChange}
            onTrackChange={handleTrackChange}
          />
          
          {/* Swipe hint */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            Свайпните для переключения
          </p>
        </section>

        {/* All Music Grid */}
        <MusicGrid 
          tracks={tracks} 
          onTrackClick={handleGridTrackClick}
        />
      </main>

      {/* Fixed Mini Player */}
      <MiniPlayer
        track={currentTrack}
        isPlaying={isPlaying && playingTrack?.id === currentTrack.id}
        progress={progress}
        onToggle={handlePlayToggle}
      />

      <Footer />
    </div>
  );
};

export default MusicPage;
