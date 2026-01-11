import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { heroImages, latestRelease } from "@/data/siteData";
import { ChevronRight } from "lucide-react";
import CookieBanner from "@/components/home/CookieBanner";
import ContactFab from "@/components/home/ContactFab";
import FooterNavButton from "@/components/home/FooterNavButton";

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
        {/* Hero section - fullscreen */}
        <section
          ref={heroRef}
          className="relative h-screen w-full overflow-hidden bg-muted"
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

          {/* Desktop: Release Card - positioned bottom right like Gaga */}
          <div className="hidden md:block absolute bottom-6 right-6 max-w-sm">
            <Link
              to="/music/latest"
              className={`
                block bg-background/90 backdrop-blur-md rounded-2xl p-4 
                shadow-lg border border-border/50 
                transition-all duration-500 hover:shadow-xl hover:scale-[1.02]
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
              `}
            >
              <div className="flex items-center gap-4">
                {/* Album cover */}
                <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden shadow-md">
                  <img
                    src={latestRelease.coverImage}
                    alt={latestRelease.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {latestRelease.year} • {latestRelease.type}
                  </span>
                  <h2 className="text-base font-bold text-foreground truncate mt-0.5">
                    {latestRelease.title}
                  </h2>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          </div>

          {/* Mobile: Full-width release banner at bottom - clickable, no buttons */}
          <Link
            to="/music/latest"
            className={`
              md:hidden absolute bottom-0 left-0 right-0
              bg-background/95 backdrop-blur-md p-4
              border-t border-border/30
              transition-all duration-500
              ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
            `}
          >
            <div className="flex items-center gap-3">
              {/* Album cover */}
              <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden shadow-md">
                <img
                  src={latestRelease.coverImage}
                  alt={latestRelease.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {latestRelease.year} • {latestRelease.type}
                </span>
                <h2 className="text-sm font-bold text-foreground truncate mt-0.5">
                  {latestRelease.title}
                </h2>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Link>
        </section>
      </main>

      {/* Desktop: Footer hidden, replaced by nav button */}
      <FooterNavButton />
      
      {/* Mobile: No footer at all, only banner above */}
      
      <ContactFab />
      <CookieBanner />
    </div>
  );
}
