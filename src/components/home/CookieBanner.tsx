import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("va_cookie_consent");
    if (consent !== "yes") {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("va_cookie_consent", "yes");
    setIsVisible(false);
  };

  const declineCookies = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-300"
      role="dialog"
      aria-label="Согласие на использование cookies"
    >
      <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Мы используем cookies для улучшения работы сайта.{" "}
              <a
                href="https://vanyaaladin.com/policy"
                target="_blank"
                rel="noopener"
                className="text-primary hover:underline"
              >
                Подробнее
              </a>
            </p>
          </div>
          <button
            onClick={declineCookies}
            className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={acceptCookies}
            className="flex-1 py-2.5 px-4 text-xs font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
          >
            Принять
          </button>
          <button
            onClick={declineCookies}
            className="py-2.5 px-4 text-xs font-medium bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}
