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

  // Dark theme detection
  const isDarkTheme = location.pathname.startsWith("/music");

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
      {/* Backdrop - EXACT Lady Gaga style */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: isDarkTheme 
            ? 'rgba(0, 0, 0, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)'
        }} 
      />

      {/* Menu panel - EXACT Lady Gaga minimal style */}
      <div
        ref={menuRef}
        className={`absolute top-0 left-0 h-full w-[240px] overflow-y-auto transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: isDarkTheme ? '#000' : '#fff',
          borderRight: isDarkTheme ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
        }}
      >
        {/* Header - EXACT Lady Gaga */}
        <div 
          className="flex items-center justify-between px-4 py-4"
          style={{
            borderBottom: isDarkTheme ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
          }}
        >
          <span 
            className="text-[10px] font-medium uppercase tracking-[0.06em]"
            style={{ 
              color: isDarkTheme ? '#fff' : '#000',
              fontFamily: 'Inter, Helvetica, Arial, sans-serif'
            }}
          >
            Меню
          </span>
          <button
            onClick={onClose}
            className="p-1 transition-opacity hover:opacity-60"
            type="button"
            aria-label="Закрыть"
            style={{ color: isDarkTheme ? '#fff' : '#000' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation links - EXACT Lady Gaga SideNavigation style */}
        <nav className="py-3" aria-label="Меню навигации">
          <ul className="grid gap-1">
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
                      className="relative block px-4 py-2 text-xs transition-all duration-200"
                      style={{ 
                        color: isDarkTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        fontFamily: 'Inter, Helvetica, Arial, sans-serif'
                      }}
                      onClick={onClose}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(8px)';
                        e.currentTarget.style.color = isDarkTheme ? '#fff' : '#000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.color = isDarkTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
                      }}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="relative block px-4 py-2 text-xs transition-all duration-200"
                      style={{ 
                        color: isActive 
                          ? (isDarkTheme ? '#fff' : '#000') 
                          : (isDarkTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                        transform: isActive ? 'translateX(8px)' : 'translateX(0)',
                        fontFamily: 'Inter, Helvetica, Arial, sans-serif'
                      }}
                      onClick={onClose}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.transform = 'translateX(8px)';
                          e.currentTarget.style.color = isDarkTheme ? '#fff' : '#000';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.color = isDarkTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
                        }
                      }}
                    >
                      {/* Active border - EXACT Lady Gaga */}
                      {isActive && (
                        <span 
                          className="absolute inset-y-0 -left-2 -right-2 rounded border pointer-events-none"
                          style={{ borderColor: isDarkTheme ? '#fff' : '#000' }}
                        />
                      )}
                      {link.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Divider */}
        <div 
          className="mx-4" 
          style={{ 
            borderTop: isDarkTheme ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' 
          }} 
        />

        {/* Social links - minimal */}
        <div className="p-4">
          <div className="flex gap-2">
            {socialLinks.slice(0, 4).map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel={social.rel || "noopener"}
                aria-label={social.name}
                className="flex items-center justify-center w-8 h-8 rounded transition-opacity hover:opacity-60"
                style={{ 
                  background: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' 
                }}
              >
                <img 
                  src={social.icon} 
                  alt={social.name} 
                  className="w-3.5 h-3.5" 
                  style={{ filter: isDarkTheme ? 'brightness(0) invert(1) opacity(0.6)' : 'brightness(0) opacity(0.4)' }}
                  loading="lazy" 
                />
              </a>
            ))}
          </div>
        </div>

        {/* Footer - minimal */}
        <div 
          className="absolute bottom-0 left-0 right-0 px-4 py-3 text-[10px]"
          style={{ color: isDarkTheme ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
        >
          <a
            href="https://vanyaaladin.com/policy"
            target="_blank"
            rel="noopener"
            className="hover:opacity-80 transition-opacity"
          >
            Политика
          </a>
        </div>
      </div>
    </div>
  );
}
