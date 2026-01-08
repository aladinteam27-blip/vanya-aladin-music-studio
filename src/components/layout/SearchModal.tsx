import { useState, useEffect, useRef, useMemo } from "react";
import { X } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Searchable items - music and pages
const searchableItems = [
  { title: "Девочка-весна", url: "https://vanyaaladin.com/music/devochka-vesna" },
  { title: "Не улетай", url: "https://vanyaaladin.com/music/ne-uletay" },
  { title: "ДАВАЙ ВАЛИ", url: "https://vanyaaladin.com/music/davay-vali" },
  { title: "Опять влюблённый", url: "https://vanyaaladin.com/music/opyat-vlyublyonnyy" },
  { title: "Плакала", url: "https://vanyaaladin.com/music/plakala" },
  { title: "Главная", url: "https://vanyaaladin.com" },
  { title: "Музыка", url: "https://vanyaaladin.com/music" },
  { title: "Биография", url: "https://vanyaaladin.com/wiki/aladin-vanya" },
  { title: "Даты концертов", url: "https://vanyaaladin.com/live" },
  { title: "Контакты", url: "https://vanyaaladin.com/contacts" },
];

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Find inline suggestion based on current query
  const inlineSuggestion = useMemo(() => {
    if (!query.trim() || query.length < 2) return "";

    const lowerQuery = query.toLowerCase();

    // Find a match that starts with the query
    for (const item of searchableItems) {
      const title = item.title.toLowerCase();
      if (title.startsWith(lowerQuery) && title !== lowerQuery) {
        return item.title;
      }
    }
    return "";
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSearchSubmit = () => {
    onClose();
    // Find matching item and navigate
    const searchQuery = query.trim().toLowerCase();
    const matchedItem = searchableItems.find(
      item => item.title.toLowerCase() === searchQuery
    );
    
    if (matchedItem) {
      window.location.href = matchedItem.url;
    } else {
      // Navigate to search page on main site
      window.location.href = `https://vanyaaladin.com/search?q=${encodeURIComponent(query)}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    }
    // Tab to accept suggestion
    if (e.key === "Tab" && inlineSuggestion) {
      e.preventDefault();
      setQuery(inlineSuggestion);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Full screen overlay */}
      <div
        className="absolute inset-0 bg-background/98 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 md:top-8 md:right-8 p-3 text-muted-foreground hover:text-foreground transition-colors z-10"
          aria-label="Закрыть поиск"
        >
          <X className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* Centered search input */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-4xl">
            {/* Input container with inline suggestion */}
            <div className="relative">
              {/* Inline suggestion (gray text) */}
              {inlineSuggestion && (
                <div className="absolute inset-0 flex items-center pointer-events-none">
                  <span className="text-3xl md:text-5xl lg:text-6xl font-light text-transparent">
                    {query}
                  </span>
                  <span className="text-3xl md:text-5xl lg:text-6xl font-light text-muted-foreground/40">
                    {inlineSuggestion.slice(query.length)}
                  </span>
                </div>
              )}

              {/* Actual input */}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Нажмите Enter для поиска"
                className="w-full bg-transparent text-3xl md:text-5xl lg:text-6xl font-light text-foreground placeholder:text-muted-foreground/50 focus:outline-none border-b-2 border-border focus:border-foreground transition-colors pb-4"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {/* Hint */}
            <p className="mt-6 text-sm text-muted-foreground">
              Введите запрос и нажмите <kbd className="px-2 py-1 bg-muted rounded text-xs font-medium">Enter</kbd>
              {inlineSuggestion && (
                <span className="ml-4">
                  или <kbd className="px-2 py-1 bg-muted rounded text-xs font-medium">Tab</kbd> для автозаполнения
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
