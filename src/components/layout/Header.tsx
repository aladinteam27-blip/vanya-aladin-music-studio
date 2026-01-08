import { useState, useEffect, useRef, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { navLinks, logoSrc } from "@/data/siteData";
import MobileMenu from "./MobileMenu";
import SearchModal from "./SearchModal";
import { Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Header = memo(function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show/hide based on scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setIsScrolled(currentScrollY > 50);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if link is active - "Музыка" active on /music
  const isActiveLink = (href: string, active?: boolean) => {
    if (href === "/music" && (location.pathname === "/music" || location.pathname.startsWith("/music"))) return true;
    if (active) return true;
    return false;
  };

  // Left side: Главная, Музыка, Биография
  const leftLinks = navLinks.slice(0, 3);
  // Right side: Даты концертов
  const rightLinks = navLinks.slice(3);

  return (
    <>
      {/* Skip to content link for accessibility */}
      <div className="fixed top-0 left-0 z-[100]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Перейти к контенту
        </a>
      </div>

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isVisible ? "translate-y-0" : "-translate-y-full",
          isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : ""
        )}
      >
        {/* Gradient overlay when not scrolled */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-500",
            isScrolled ? "opacity-0" : "opacity-100"
          )}
          style={{
            background: "linear-gradient(180deg, hsla(0,0%,100%,0.9) 0%, hsla(0,0%,100%,0) 100%)"
          }}
          aria-hidden="true"
        />

        <div className="relative px-4 md:px-6 lg:px-10 max-w-[1400px] mx-auto">
          <div className="flex items-center justify-center h-16 lg:h-[72px]">
            
            {/* Mobile menu trigger - absolute left */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden absolute left-4 p-2 text-foreground/70 hover:text-foreground transition-colors"
              type="button"
              aria-label="Открыть меню"
              aria-haspopup="dialog"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile search button - absolute right */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="lg:hidden absolute right-4 p-2 text-foreground/70 hover:text-foreground transition-colors"
              type="button"
              aria-label="Открыть поиск"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Desktop: Navigation spanning full width with logo centered */}
            <nav className="hidden lg:flex items-center justify-between w-full" aria-label="Основная навигация">
              {/* Left nav items: Главная, Музыка, Биография */}
              <div className="flex items-center gap-10">
                {leftLinks.map((link) => {
                  const isActive = isActiveLink(link.href, link.active);
                  const isExternal = link.external;
                  
                  if (isExternal) {
                    return (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel={link.rel || "noopener"}
                        className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    );
                  }
                  
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isActive 
                          ? "text-[#2563eb] border-b-2 border-[#2563eb] pb-0.5" 
                          : "text-foreground/70 hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Center Logo - BLACK */}
              <a
                href="https://vanyaaladin.com/"
                aria-label="Главная"
                className="absolute left-1/2 -translate-x-1/2 transition-all duration-300 hover:scale-105 hover:opacity-80"
              >
                <img
                  src={logoSrc}
                  alt="Ваня Аладин — логотип"
                  width={160}
                  height={64}
                  className="h-12 lg:h-14 w-auto object-contain"
                  style={{ filter: 'brightness(0)' }}
                  loading="eager"
                  fetchPriority="high"
                />
              </a>

              {/* Right nav items: Даты концертов, Контакты, Search */}
              <div className="flex items-center gap-10">
                {rightLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.rel || (link.external ? "noopener" : undefined)}
                    className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <a 
                  href="https://vanyaaladin.com/contacts" 
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  Контакты
                </a>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 text-foreground/70 hover:text-foreground transition-colors"
                  type="button"
                  aria-label="Открыть поиск"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </nav>

            {/* Mobile: Centered Logo - BLACK */}
            <a
              href="https://vanyaaladin.com/"
              aria-label="Главная"
              className="lg:hidden transition-all duration-300 hover:scale-105 hover:opacity-80"
            >
              <img
                src={logoSrc}
                alt="Ваня Аладин — логотип"
                width={120}
                height={48}
                className="h-9 w-auto object-contain"
                style={{ filter: 'brightness(0)' }}
                loading="eager"
                fetchPriority="high"
              />
            </a>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Search modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
});
