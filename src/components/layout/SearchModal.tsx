import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { navLinks, latestRelease, contactInfo, socialLinks } from "@/data/siteData";

interface SearchResult {
  title: string;
  description: string;
  url: string;
  category: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Searchable content from the site
const searchableContent: SearchResult[] = [
  { title: "Главная", description: "Главная страница сайта Ваня Аладин", url: "/", category: "Страницы" },
  { title: "Музыка", description: "Все треки и альбомы Вани Аладина", url: "https://vanyaaladin.com/music", category: "Страницы" },
  { title: "Биография", description: "История и биография артиста", url: "https://vanyaaladin.com/wiki/aladin-vanya", category: "Страницы" },
  { title: "Даты концертов", description: "Расписание выступлений и концертов", url: "https://vanyaaladin.com/live", category: "Страницы" },
  { title: "Контакты", description: "Связаться с командой артиста", url: "/contacts", category: "Страницы" },
  { title: latestRelease.title, description: `${latestRelease.year} ${latestRelease.type} — новый релиз`, url: latestRelease.listenUrl, category: "Музыка" },
  { title: "Пресейв", description: "Сохранить новый релиз заранее", url: latestRelease.presaveUrl, category: "Музыка" },
  { title: `Букинг — ${contactInfo.booking.name}`, description: contactInfo.booking.phone, url: `tel:${contactInfo.booking.phone.replace(/\s/g, "")}`, category: "Контакты" },
  { title: "Email", description: contactInfo.pr.email, url: `mailto:${contactInfo.pr.email}`, category: "Контакты" },
  ...socialLinks.map(social => ({
    title: social.name,
    description: `Официальный ${social.name} Вани Аладина`,
    url: social.url,
    category: "Соцсети"
  })),
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = searchableContent.filter(
      item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
    );
    setResults(filtered);
  }, [query]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop with fade animation */}
      <div 
        className={`fixed inset-0 z-[100] bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      
      {/* Modal with slide animation */}
      <div 
        className={`fixed inset-x-0 top-0 z-[101] transition-all duration-300 ease-out ${
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div 
          className="w-full max-w-xl mx-4 md:mx-auto mt-16 md:mt-24 bg-background rounded-2xl shadow-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input - minimal */}
          <div className="flex items-center gap-3 p-4">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
            />
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              aria-label="Закрыть поиск"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results - only show when there's a query */}
          {query.trim() !== "" && (
            <div className="max-h-[50vh] overflow-y-auto border-t border-border">
              {results.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-sm">Ничего не найдено</p>
                </div>
              ) : (
                <div className="py-1">
                  {results.map((result, index) => (
                    <a
                      key={index}
                      href={result.url}
                      target={result.url.startsWith("http") ? "_blank" : undefined}
                      rel={result.url.startsWith("http") ? "noopener noreferrer" : undefined}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-foreground font-medium block truncate">{result.title}</span>
                        <span className="text-xs text-muted-foreground">{result.category}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer hint - hide on mobile */}
          <div className="hidden md:block px-4 py-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              <kbd className="px-1 py-0.5 bg-muted rounded text-foreground/70 text-[10px]">Esc</kbd> закрыть
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
