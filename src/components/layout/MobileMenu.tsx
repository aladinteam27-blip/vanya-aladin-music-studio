import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { navLinks, socialLinks } from "@/data/siteData";
import { useLockBodyScroll, useEscapeKey } from "@/hooks/useBodyLock";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useLockBodyScroll(isOpen);
  useEscapeKey(onClose, isOpen);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Check if link is active
  const isActiveLink = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleBackdropClick}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label="Меню навигации"
    >
      {/* Backdrop - minimal blur like Gaga */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Menu panel - minimal like Gaga */}
      <div
        ref={menuRef}
        className={`absolute top-0 left-0 h-full w-[280px] bg-background border-r border-border/30 overflow-y-auto transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header - minimal */}
        <div className="flex items-center justify-between p-5 border-b border-border/20">
          <span className="text-sm font-medium text-foreground uppercase tracking-wider">Меню</span>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-foreground/50 hover:text-foreground transition-colors"
            type="button"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links - clean, minimal */}
        <nav className="py-4" aria-label="Меню навигации">
          <ul>
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.href);
              const isExternal = link.external;
              
              return (
                <li key={link.href}>
                  {isExternal ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel={link.rel || "noopener"}
                      className="block px-6 py-3 text-sm text-foreground/60 hover:text-foreground transition-colors"
                      onClick={onClose}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className={`block px-6 py-3 text-sm transition-colors ${
                        isActive 
                          ? "text-foreground font-medium" 
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                      onClick={onClose}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Divider */}
        <div className="border-t border-border/20 mx-5" />

        {/* Social links - compact */}
        <div className="p-5">
          <div className="flex gap-3">
            {socialLinks.slice(0, 4).map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel={social.rel || "noopener"}
                aria-label={social.name}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              >
                <img 
                  src={social.icon} 
                  alt={social.name} 
                  className="w-4 h-4" 
                  style={{ filter: "brightness(0) opacity(0.4)" }}
                  loading="lazy" 
                />
              </a>
            ))}
          </div>
        </div>

        {/* Footer - minimal */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-xs text-muted-foreground/50">
          <a
            href="https://vanyaaladin.com/policy"
            target="_blank"
            rel="noopener"
            className="hover:text-foreground/60 transition-colors"
          >
            Политика
          </a>
        </div>
      </div>
    </div>
  );
}
