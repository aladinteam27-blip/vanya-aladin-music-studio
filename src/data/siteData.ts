// Site data configuration

export const logoSrc = "https://static.tildacdn.com/tild3664-3762-4031-a330-356238346564/VA_Logo_Black.png";

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
  rel?: string;
  active?: boolean;
}

// Navigation links - "Музыка" is now active since we're on /music
export const navLinks: NavLink[] = [
  { href: "https://vanyaaladin.com/", label: "Главная", external: true },
  { href: "/music", label: "Музыка", active: true },
  { href: "https://vanyaaladin.com/wiki/aladin-vanya", label: "Биография", external: true },
  { href: "https://vanyaaladin.com/live", label: "Даты концертов", external: true },
];

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
  rel?: string;
}

export const socialLinks: SocialLink[] = [
  {
    name: "Telegram",
    url: "https://t.me/aladin_vanya",
    icon: "https://static.tildacdn.com/tild3661-6234-4466-b033-356336323230/telegram.svg",
    rel: "noopener nofollow",
  },
  {
    name: "VK",
    url: "https://vk.com/aladin_vanya",
    icon: "https://static.tildacdn.com/tild6562-6235-4234-b666-653733653033/vk.svg",
    rel: "noopener nofollow",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/aladin_vanya/",
    icon: "https://static.tildacdn.com/tild3834-6232-4665-a334-613137313132/instagram.svg",
    rel: "noopener nofollow",
  },
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@aladin_vanya",
    icon: "https://static.tildacdn.com/tild3939-6534-4262-b961-343933353530/tiktok.svg",
    rel: "noopener nofollow",
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/@VanyaAladin",
    icon: "https://static.tildacdn.com/tild3437-6361-4932-b762-623261343137/youtube.svg",
    rel: "noopener nofollow",
  },
];

export const contactInfo = {
  booking: {
    name: "Ваня",
    phone: "+7 926 123-45-67",
  },
  pr: {
    email: "aladinteam27@gmail.com",
  },
};

export const latestRelease = {
  title: "Девочка-весна",
  year: 2025,
  type: "Сингл",
  listenUrl: "https://band.link/devochka-vesna",
  presaveUrl: "https://band.link/devochka-vesna",
};
