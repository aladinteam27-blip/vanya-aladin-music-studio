import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/music', label: 'Музыка' },
  { href: '/video', label: 'Видео' },
  { href: '/about', label: 'Обо мне' },
  { href: '/contact', label: 'Контакты' },
];

export const Header = memo(function Header() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-xl font-semibold tracking-tight text-foreground transition-opacity hover:opacity-70"
          >
            Ваня Аладин
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'nav-link text-sm font-medium tracking-wide uppercase',
                    location.pathname === item.href && 'active'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Menu Button */}
          <MobileMenu currentPath={location.pathname} />
        </nav>
      </div>
    </header>
  );
});

// Mobile Menu Component
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

function MobileMenu({ currentPath }: { currentPath: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-foreground"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 top-[65px] bg-background z-40 transition-all duration-300',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
      >
        <ul className="flex flex-col items-center gap-6 pt-12">
          {navItems.map((item, index) => (
            <li
              key={item.href}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'text-lg font-medium tracking-wide uppercase transition-colors',
                  currentPath === item.href 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
