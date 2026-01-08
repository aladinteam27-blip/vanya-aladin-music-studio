import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { navLinks, socialLinks, contactInfo } from "@/data/siteData";
import { useLockBodyScroll, useEscapeKey } from "@/hooks/useBodyLock";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  useLockBodyScroll(isOpen);
  useEscapeKey(onClose, isOpen);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Check if link is active - "Музыка" active on /music
  const isActiveLink = (href: string) => {
    if (href === "/music" && (location.pathname === "/music" || location.pathname.startsWith("/music"))) return true;
    return false;
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
      {/* Backdrop - light blur */}
      <div className="absolute inset-0 bg-foreground/10 backdrop-blur-sm" />

      {/* Menu panel */}
      <div
        ref={menuRef}
        className={`absolute top-0 left-0 h-full w-[85%] max-w-[380px] bg-background border-r border-border shadow-lg overflow-y-auto transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm border-b border-border">
          <span className="text-lg font-semibold text-foreground">Меню</span>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-foreground/60 hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            type="button"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="p-4" aria-label="Меню навигации">
          <ul className="space-y-1">
            {navLinks.map((link, index) => {
              const isActive = isActiveLink(link.href);
              const isExternal = link.external;
              
              return (
                <li key={link.href} style={{ animationDelay: `${index * 50}ms` }}>
                  {isExternal ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel={link.rel || "noopener"}
                      className="block px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted transition-all duration-200"
                      onClick={onClose}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className={`block px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive 
                          ? "bg-blue-50 text-[#2563eb] font-medium border-l-2 border-[#2563eb]" 
                          : "text-foreground/80 hover:text-foreground hover:bg-muted"
                      }`}
                      onClick={onClose}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              );
            })}
            <li style={{ animationDelay: `${navLinks.length * 50}ms` }}>
              <a
                href="https://vanyaaladin.com/contacts"
                target="_blank"
                rel="noopener"
                className="block px-4 py-3 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted transition-all duration-200"
                onClick={onClose}
              >
                Контакты
              </a>
            </li>
          </ul>
        </nav>

        {/* Contact info */}
        <div className="px-4 py-6 border-t border-border">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Контакты</h3>
          <div className="space-y-2 text-sm text-foreground/70">
            <p>
              Концерты:{" "}
              <a href={`tel:${contactInfo.booking.phone.replace(/\s/g, "")}`} className="text-foreground hover:text-primary transition-colors">
                {contactInfo.booking.phone}
              </a>{" "}
              — {contactInfo.booking.name}
            </p>
            <p>
              PR:{" "}
              <a href={`mailto:${contactInfo.pr.email}`} className="text-foreground hover:text-primary transition-colors">
                {contactInfo.pr.email}
              </a>
            </p>
          </div>
        </div>

        {/* Social links */}
        <div className="px-4 py-6 border-t border-border">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Социальные сети</h3>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel={social.rel || "noopener"}
                aria-label={social.name}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted hover:bg-primary/10 transition-all duration-200 hover:scale-110"
              >
                <img 
                  src={social.icon} 
                  alt={social.name} 
                  className="w-5 h-5" 
                  style={{ filter: "brightness(0) opacity(0.6)" }}
                  loading="lazy" 
                />
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Ваня Аладин ·{" "}
            <a
              href="https://vanyaaladin.com/policy"
              target="_blank"
              rel="noopener"
              className="hover:text-foreground transition-colors"
            >
              Политика конфиденциальности
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
