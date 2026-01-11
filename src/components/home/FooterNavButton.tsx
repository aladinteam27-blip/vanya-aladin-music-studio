import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MoreHorizontal, X } from "lucide-react";
import { navLinks, socialLinks } from "@/data/siteData";
import { motion, AnimatePresence } from "framer-motion";

export default function FooterNavButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const isActiveLink = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 left-6 z-50 hidden md:block">
      {/* Toggle button - круглая с троеточием как у Gaga */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          bg-background/90 backdrop-blur-sm border border-border/50
          shadow-lg hover:shadow-xl transition-all duration-300
          hover:scale-105 active:scale-95
          ${isOpen ? "bg-foreground text-background" : "text-foreground"}
        `}
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <MoreHorizontal className="w-5 h-5" />
        )}
      </button>

      {/* Navigation popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-16 left-0 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl overflow-hidden min-w-[200px]"
          >
            {/* Navigation links */}
            <nav className="p-2">
              <ul className="space-y-1">
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
                          className="block px-4 py-2.5 rounded-xl text-sm text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className={`block px-4 py-2.5 rounded-xl text-sm transition-colors ${
                            isActive 
                              ? "text-foreground font-medium bg-muted/50" 
                              : "text-foreground/70 hover:text-foreground hover:bg-muted/50"
                          }`}
                          onClick={() => setIsOpen(false)}
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
            <div className="border-t border-border/30 mx-3" />

            {/* Social links */}
            <div className="p-3">
              <div className="flex gap-2">
                {socialLinks.slice(0, 4).map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel={social.rel || "noopener"}
                    aria-label={social.name}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <img 
                      src={social.icon} 
                      alt={social.name} 
                      className="w-4 h-4" 
                      style={{ filter: "brightness(0) opacity(0.5)" }}
                      loading="lazy" 
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Legal links */}
            <div className="border-t border-border/30 p-3">
              <div className="flex gap-3 text-xs text-muted-foreground">
                <a 
                  href="https://vanyaaladin.com/policy" 
                  target="_blank" 
                  rel="noopener"
                  className="hover:text-foreground transition-colors"
                >
                  Политика
                </a>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("openCookieSettings"));
                    setIsOpen(false);
                  }}
                  className="hover:text-foreground transition-colors"
                >
                  Cookies
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
