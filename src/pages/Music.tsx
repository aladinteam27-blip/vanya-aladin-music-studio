import { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CoverCarousel } from '@/components/music/CoverCarousel';
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
    play,
    pause,
    toggle
  } = useAudioPlayer();

  // When track changes via carousel AND player is playing, switch to new track (don't stop)
  // Like Lady Gaga - player continues playing the new track when swiping
  const handleIndexChange = useCallback((index: number) => {
    const wasPlaying = isPlaying;
    setCurrentIndex(index);
    
    // If was playing, automatically play the new track
    if (wasPlaying) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        play(tracks[index]);
      }, 50);
    }
  }, [isPlaying, play]);

  // Handle track change (called from carousel)
  const handleTrackChange = useCallback((track: Track) => {
    // Player continues on its own via handleIndexChange
  }, []);

  // Handle play toggle
  const handlePlayToggle = useCallback(() => {
    toggle(currentTrack);
  }, [toggle, currentTrack]);

  // Handle track click from grid
  const handleGridTrackClick = useCallback((track: Track, index: number) => {
    const wasPlaying = isPlaying;
    setCurrentIndex(index);
    
    // Scroll to top to see the carousel
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // If was playing, play the new track
    if (wasPlaying) {
      setTimeout(() => {
        play(tracks[index]);
      }, 50);
    }
  }, [isPlaying, play]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Hero Section with Carousel - Fullscreen */}
      <main className="pt-16" id="main">
        {/* Cover Carousel with integrated title */}
        <CoverCarousel
          tracks={tracks}
          currentIndex={currentIndex}
          onIndexChange={handleIndexChange}
          onTrackChange={handleTrackChange}
        />

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
