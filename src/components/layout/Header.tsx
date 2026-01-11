import { useState, useEffect, useRef, memo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { navLinks, logoSrc } from "@/data/siteData";
import MobileMenu from "./MobileMenu";
import { Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Header = memo(function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're on dark theme page (music)
  const isDarkTheme = location.pathname.startsWith("/music");

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

  // Focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setSearchQuery("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSearchOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    if (isSearchOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSearchOpen]);

  // Check if link is active
  const isActiveLink = (href: string) => {
    if (href === "/" && location.pathname === "/") return true;
    if (href === "/music" && location.pathname.startsWith("/music")) return true;
    return false;
  };

  // Handle search submit - navigate to search page
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  // Left side: Главная, Музыка
  const leftLinks = navLinks.slice(0, 2);
  // Right side: Биография, Даты концертов
  const rightLinks = navLinks.slice(2);

  // Logo filter: invert for dark theme
  const logoFilter = isDarkTheme ? 'brightness(0) invert(1)' : 'brightness(0)';

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
            background: isDarkTheme
              ? "linear-gradient(180deg, hsla(0,0%,0%,0.9) 0%, hsla(0,0%,0%,0) 100%)"
              : "linear-gradient(180deg, hsla(0,0%,100%,0.9) 0%, hsla(0,0%,100%,0) 100%)"
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
              {/* Left nav items: Главная, Музыка */}
              <div className="flex items-center gap-10">
                {leftLinks.map((link) => {
                  const isActive = isActiveLink(link.href);
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
                          ? "text-foreground border-b-2 border-foreground pb-0.5" 
                          : "text-foreground/70 hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Center Logo */}
              <Link
                to="/"
                aria-label="Главная"
                className="absolute left-1/2 -translate-x-1/2 transition-all duration-300 hover:scale-105 hover:opacity-80"
              >
                <img
                  src={logoSrc}
                  alt="Ваня Аладин — логотип"
                  width={160}
                  height={64}
                  className="h-12 lg:h-14 w-auto object-contain"
                  style={{ filter: logoFilter }}
                  loading="eager"
                  fetchPriority="high"
                />
              </Link>

              {/* Right nav items: Биография, Даты концертов, Search */}
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

            {/* Mobile: Centered Logo */}
            <Link
              to="/"
              aria-label="Главная"
              className="lg:hidden transition-all duration-300 hover:scale-105 hover:opacity-80"
            >
              <img
                src={logoSrc}
                alt="Ваня Аладин — логотип"
                width={120}
                height={48}
                className="h-9 w-auto object-contain"
                style={{ filter: logoFilter }}
                loading="eager"
                fetchPriority="high"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Compact Search Modal */}
      <>
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-[100] bg-foreground/20 backdrop-blur-sm transition-opacity duration-300",
            isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsSearchOpen(false)}
        />

        {/* Modal */}
        <div
          className={cn(
            "fixed inset-x-0 top-0 z-[101] transition-all duration-300 ease-out",
            isSearchOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          )}
        >
          <div
            className="w-full max-w-md mx-auto mt-20 mx-4 md:mx-auto bg-background rounded-2xl shadow-lg overflow-hidden border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 p-4">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                aria-label="Закрыть поиск"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground/70 text-[10px] font-mono">Enter</kbd> для поиска · <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground/70 text-[10px] font-mono">Esc</kbd> закрыть
              </p>
            </div>
          </div>
        </div>
      </>
    </>
  );
});
