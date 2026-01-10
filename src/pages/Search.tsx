import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import CookieBanner from "@/components/home/CookieBanner";
import {
  getAllSearchableItems,
  type SearchableItem,
  type MusicItem,
  type PageItem
} from "@/data/siteData";

type CategoryFilter = "all" | "Music" | "Pages";

const INITIAL_SHOW_COUNT = 6;
const LOAD_MORE_COUNT = 6;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = (searchParams.get("category") || "all") as CategoryFilter;

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(initialCategory);
  const [visibleCount, setVisibleCount] = useState(INITIAL_SHOW_COUNT);

  // Sync with URL params
  useEffect(() => {
    const urlQuery = searchParams.get("q") || "";
    if (urlQuery !== query) {
      setQuery(urlQuery);
      setInputValue(urlQuery);
    }
  }, [searchParams]);

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeCategory !== "all") params.set("category", activeCategory);
    setSearchParams(params, { replace: true });
  }, [query, activeCategory, setSearchParams]);

  // Reset visible count when category or query changes
  useEffect(() => {
    setVisibleCount(INITIAL_SHOW_COUNT);
  }, [activeCategory, query]);

  // Filter results - sorted from newest to oldest
  const results = useMemo(() => {
    const allItems = getAllSearchableItems();

    let filtered = allItems;

    // Apply category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter(item => item.category === activeCategory);
    }

    // Apply search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(lowerQuery);
        const categoryMatch = item.category.toLowerCase().includes(lowerQuery);

        if (item.category === "Music") {
          const musicItem = item as MusicItem;
          return titleMatch || categoryMatch ||
            musicItem.type.toLowerCase().includes(lowerQuery) ||
            musicItem.year.includes(lowerQuery);
        }

        if (item.category === "Pages") {
          const pageItem = item as PageItem;
          return titleMatch || categoryMatch ||
            pageItem.description.toLowerCase().includes(lowerQuery);
        }

        return titleMatch || categoryMatch;
      });
    }

    // Sort: music by year descending, then pages
    return filtered.sort((a, b) => {
      if (a.category === "Music" && b.category === "Music") {
        return parseInt((b as MusicItem).year) - parseInt((a as MusicItem).year);
      }
      if (a.category === "Music") return -1;
      if (b.category === "Music") return 1;
      return 0;
    });
  }, [query, activeCategory]);

  // Determine visible results
  const visibleResults = useMemo(() => {
    if (query.trim() || activeCategory !== "all") {
      return results;
    }
    return results.slice(0, visibleCount);
  }, [results, visibleCount, query, activeCategory]);

  const hasMoreToShow = !query.trim() && activeCategory === "all" && visibleCount < results.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setQuery(inputValue);
    }
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + LOAD_MORE_COUNT);
    setTimeout(() => {
      window.scrollTo({
        top: window.scrollY + 200,
        behavior: "smooth"
      });
    }, 100);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "Music": return "Музыка";
      case "Pages": return "Страницы";
      default: return category;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main id="main" className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Results count */}
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
            РЕЗУЛЬТАТЫ ПОИСКА: {results.length}
          </p>

          {/* Search input */}
          <form onSubmit={handleSearchSubmit} className="mb-8">
            <div className="relative max-w-2xl group">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -m-[2px]" />
              <div className="relative flex items-center bg-background border border-border rounded-2xl overflow-hidden group-focus-within:border-primary/50 transition-all duration-300">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Введите, что хотите найти"
                  className="w-full px-6 py-5 text-lg md:text-xl bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
          </form>

          {/* Layout with filters sidebar and results */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters sidebar */}
            <aside className="lg:w-48 flex-shrink-0">
              <div className="sticky top-24">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">ФИЛЬТР:</p>
                <nav className="flex flex-wrap lg:flex-col gap-2">
                  <button
                    onClick={() => setActiveCategory("all")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                      activeCategory === "all"
                        ? "bg-foreground text-background"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    Все категории
                  </button>
                  <button
                    onClick={() => setActiveCategory("Music")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                      activeCategory === "Music"
                        ? "bg-foreground text-background"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    Музыка
                  </button>
                  <button
                    onClick={() => setActiveCategory("Pages")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                      activeCategory === "Pages"
                        ? "bg-foreground text-background"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    Страницы
                  </button>
                </nav>
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1">
              {results.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl text-muted-foreground mb-2">Ничего не найдено</p>
                  <p className="text-sm text-muted-foreground">
                    Попробуйте изменить запрос или выбрать другую категорию
                  </p>
                </div>
              ) : (
                <>
                  <div className="border-t border-border">
                    {visibleResults.map((item) => (
                      <SearchResultItem key={item.id} item={item} getCategoryLabel={getCategoryLabel} />
                    ))}
                  </div>

                  {/* Show more button */}
                  {hasMoreToShow && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={handleShowMore}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-medium transition-all duration-200 hover:gap-3"
                      >
                        <span>Ещё</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}

interface SearchResultItemProps {
  item: SearchableItem;
  getCategoryLabel: (category: string) => string;
}

function SearchResultItem({ item, getCategoryLabel }: SearchResultItemProps) {
  const isMusic = item.category === "Music";
  const musicItem = isMusic ? (item as MusicItem) : null;
  const isExternal = item.url.startsWith("http");

  return (
    <a
      href={item.url}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener" : undefined}
      className="block"
    >
      <div className="flex items-center gap-4 py-4 px-2 border-b border-border hover:bg-muted/30 transition-colors group">
        {/* Category label */}
        <div className="w-16 md:w-20 flex-shrink-0">
          <span className="text-xs md:text-sm text-muted-foreground">{getCategoryLabel(item.category)}</span>
        </div>

        {/* Image (for music) */}
        {isMusic && musicItem && (
          <div className="w-14 h-14 md:w-20 md:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted group-hover:ring-2 group-hover:ring-primary/30 transition-all">
            <img
              src={musicItem.coverImage}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base md:text-lg font-semibold text-foreground truncate">
            {item.title}
          </h2>
          {item.category === "Pages" && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {(item as PageItem).description}
            </p>
          )}
          {/* Mobile: Show year and type below title */}
          {isMusic && musicItem && (
            <p className="md:hidden text-xs text-muted-foreground mt-1">
              {musicItem.year} • {musicItem.type}
            </p>
          )}
        </div>

        {/* Meta tags (for music) - desktop only */}
        {isMusic && musicItem && (
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <span className="px-3 py-1 text-xs font-medium border border-border rounded-lg">
              {musicItem.year}
            </span>
            <span className="px-3 py-1 text-xs font-medium border border-border rounded-lg">
              {musicItem.type}
            </span>
          </div>
        )}
      </div>
    </a>
  );
}
