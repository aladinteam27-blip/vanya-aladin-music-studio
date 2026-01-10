import { memo } from "react";
import { socialLinks, contactInfo } from "@/data/siteData";

interface FooterProps {
  onOpenCookieSettings?: () => void;
}

export const Footer = memo(function Footer({ onOpenCookieSettings }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const handleCookieSettings = () => {
    if (onOpenCookieSettings) {
      onOpenCookieSettings();
    } else {
      window.dispatchEvent(new CustomEvent("openCookieSettings"));
    }
  };

  return (
    <footer className="relative bg-background border-t border-border" role="contentinfo">
      <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">

          {/* Navigation */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://vanyaaladin.com/policy"
                  target="_blank"
                  rel="noopener"
                  className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  Политика конфиденциальности
                </a>
              </li>
              <li>
                <a
                  href="https://vanyaaladin.com/terms"
                  target="_blank"
                  rel="noopener"
                  className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  Условия использования
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleCookieSettings}
                  className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  Настройки Cookies
                </button>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Контакты</h3>
            <div className="space-y-2 text-sm">
              <p className="text-foreground/70">
                Концерты и реклама:{" "}
                <a
                  href={`tel:${contactInfo.booking.phone.replace(/\s/g, "")}`}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {contactInfo.booking.phone}
                </a>
                <span className="text-muted-foreground"> — {contactInfo.booking.name}</span>
              </p>
              <p className="text-foreground/70">
                PR / Пресса:{" "}
                <a
                  href={`mailto:${contactInfo.pr.email}`}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {contactInfo.pr.email}
                </a>
              </p>
            </div>
          </div>

          {/* Social links */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Социальные сети</h3>
            <ul className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel={social.rel || "noopener"}
                    aria-label={social.name}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted hover:bg-primary/10 transition-all duration-300"
                  >
                    <img
                      src={social.icon}
                      alt={social.name}
                      width={18}
                      height={18}
                      className="w-[18px] h-[18px]"
                      style={{ filter: "brightness(0) opacity(0.6)" }}
                      loading="lazy"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Ваня Аладин. Все права защищены.
          </p>
          <p className="text-xs text-muted-foreground/60 max-w-md">
            Все материалы, размещенные на данном сайте, являются собственностью их авторов.
          </p>
        </div>
      </div>

      {/* Screen reader accessibility note */}
      <span className="sr-only">
        Если вы используете скринридер и испытываете сложности с сайтом, напишите на
        aladinteam27@gmail.com.
      </span>
    </footer>
  );
});
