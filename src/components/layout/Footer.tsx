import { memo } from 'react';
import { Link } from 'react-router-dom';

const socialLinks = [
  { href: 'https://t.me/aladin_vanya', label: 'Telegram' },
  { href: 'https://vk.com/aladin_vanya', label: 'VK' },
  { href: 'https://www.instagram.com/aladin_vanya/', label: 'Instagram' },
  { href: 'https://www.tiktok.com/@aladin_vanya', label: 'TikTok' },
  { href: 'https://rutube.ru/u/VanyaAladin/', label: 'Rutube' },
];

const navLinks = [
  { href: '/', label: 'Главная' },
  { href: '/music', label: 'Музыка' },
  { href: '/video', label: 'Видео' },
  { href: '/about', label: 'Обо мне' },
  { href: '/contact', label: 'Контакты' },
];

export const Footer = memo(function Footer() {
  return (
    <footer className="border-t border-border bg-cream">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Ваня Аладин</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Российский певец и автор песен. Слушайте новые треки и следите за афишей концертов.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Навигация
            </h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Соцсети
            </h4>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ваня Аладин. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
});
