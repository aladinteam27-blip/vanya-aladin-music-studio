import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { socialLinks, contactInfo } from "@/data/siteData";
import { useEscapeKey } from "@/hooks/useBodyLock";
import { cn } from "@/lib/utils";

export default function ContactFab() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => setIsOpen(false), isOpen);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const fab = document.getElementById("contact-fab");
        if (fab && !fab.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <>
      {/* FAB Button - Hidden on mobile */}
      <button
        id="contact-fab"
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex fixed right-6 bottom-6 z-40 w-12 h-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="Контакты и соцсети"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <MoreHorizontal className="w-5 h-5" />
        )}
      </button>

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "hidden md:block fixed right-6 bottom-24 z-40 w-[320px] bg-card border border-border rounded-2xl shadow-lg transition-all duration-300",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Контакты и социальные сети"
      >
        <div className="p-5">
          {/* Contacts section */}
          <div className="mb-5">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Контакты</h4>
            <div className="space-y-2 text-sm">
              <p className="text-foreground/70">
                Концерты:{" "}
                <a href={`tel:${contactInfo.booking.phone.replace(/\s/g, "")}`} className="text-foreground hover:text-primary transition-colors">
                  {contactInfo.booking.phone}
                </a>
              </p>
              <p className="text-foreground/70">
                PR:{" "}
                <a href={`mailto:${contactInfo.pr.email}`} className="text-foreground hover:text-primary transition-colors">
                  {contactInfo.pr.email}
                </a>
              </p>
            </div>
          </div>

          {/* Social links section */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Социальные сети</h4>
            <ul className="flex flex-wrap gap-2">
              {socialLinks.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel={social.rel || "noopener"}
                    aria-label={social.name}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted hover:bg-primary/10 transition-all duration-200 hover:scale-110"
                  >
                    <img
                      src={social.icon}
                      alt={social.name}
                      width={16}
                      height={16}
                      className="w-4 h-4"
                      style={{ filter: "brightness(0) opacity(0.6)" }}
                      loading="lazy"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Ваня Аладин</p>
          </div>
        </div>
      </div>
    </>
  );
}
