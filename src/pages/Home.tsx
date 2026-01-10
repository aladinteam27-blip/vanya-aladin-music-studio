import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { heroImages, latestRelease } from "@/data/siteData";
import { Play, Bell } from "lucide-react";
import CookieBanner from "@/components/home/CookieBanner";
import ContactFab from "@/components/home/ContactFab";

export default function HomePage() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main id="main">
        {/* Hero section */}
        <section
          ref={heroRef}
          className="relative min-h-screen w-full overflow-hidden bg-muted"
          aria-label="Главный баннер"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Hidden H1 for SEO */}
          <h1 className="sr-only">{latestRelease.title} — Ваня Аладин</h1>

          {/* Background image with parallax hover effect */}
          <div className="absolute inset-0">
            {/* Desktop image */}
            <img
              src={heroImages.desktop}
              alt="Ваня Аладин"
              className={`hidden md:block w-full h-full object-cover object-center transition-transform duration-[2000ms] ease-out ${
                isHovered ? "scale-105" : "scale-100"
              }`}
              fetchPriority="high"
              loading="eager"
            />
            {/* Mobile image */}
            <img
              src={heroImages.mobile}
              alt="Ваня Аладин"
              className={`md:hidden w-full h-full object-cover object-center transition-transform duration-[2000ms] ease-out ${
                isHovered ? "scale-105" : "scale-100"
              }`}
              fetchPriority="high"
              loading="eager"
            />
          </div>

          {/* Subtle gradient overlay for readability */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)"
            }}
            aria-hidden="true"
          />

          {/* Release Card Container - centered at bottom */}
          <div className="absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <div
              className={`transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              {/* Release card with glass effect */}
              <div className="bg-background/90 backdrop-blur-md rounded-2xl p-4 md:p-5 shadow-lg relative border border-border/50">
                {/* Badge at top right corner of card */}
                <span className="absolute top-3 right-4 text-[10px] font-semibold text-primary uppercase tracking-wider">
                  {latestRelease.year} • {latestRelease.type}
                </span>

                <div className="flex items-center gap-4">
                  {/* Album cover */}
                  <div className="relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden shadow-md group">
                    <img
                      src={latestRelease.coverImage}
                      alt={latestRelease.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="eager"
                      fetchPriority="high"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h2 className="text-lg md:text-xl font-bold text-foreground mb-2 truncate">
                      {latestRelease.title}
                    </h2>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <a
                        href={latestRelease.presaveUrl}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Пресейв</span>
                      </a>
                      <a
                        href={latestRelease.listenUrl}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center justify-center gap-1.5 text-xs py-2 px-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Слушать</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-700 delay-500 ${
              isVisible ? "opacity-60" : "opacity-0"
            }`}
          >
            <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center pt-2">
              <div className="w-1 h-2 bg-foreground/40 rounded-full animate-pulse" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ContactFab />
      <CookieBanner />
    </div>
  );
}
