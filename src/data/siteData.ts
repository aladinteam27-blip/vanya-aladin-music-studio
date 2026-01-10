// Site data configuration - unified for all pages

export const logoSrc = "https://static.tildacdn.com/tild6566-3531-4636-b337-303332613731/Vanya_Aladin_logo_20.svg";

export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
  rel?: string;
}

// Navigation links - internal pages use relative paths
export const navLinks: NavLink[] = [
  { href: "/", label: "Главная" },
  { href: "/music", label: "Музыка" },
  { href: "https://vanyaaladin.com/wiki/aladin-vanya", label: "Биография", external: true, rel: "canonical noopener" },
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
    name: "RUTUBE",
    url: "https://rutube.ru/u/VanyaAladin/",
    icon: "https://thb.tildacdn.com/tild3763-6262-4133-a562-616634633236/-/resize/20x/rutube.png",
    rel: "noopener nofollow",
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/@aladin_vanya",
    icon: "https://static.tildacdn.com/tild6138-6563-4732-b039-643833336134/img_466121.png",
    rel: "noopener nofollow",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/aladin_vanya/",
    icon: "https://static.tildacdn.com/tild6262-3138-4637-b165-313665386633/Tilda_Icons_26sn_ins.svg",
    rel: "me nofollow",
  },
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@aladin_vanya",
    icon: "https://static.tildacdn.com/tild6664-6333-4365-b939-643662653138/Tilda_Icons_26sn_tik.svg",
    rel: "noopener nofollow",
  },
  {
    name: "Telegram",
    url: "https://t.me/aladin_vanya",
    icon: "https://static.tildacdn.com/tild6137-3464-4261-b066-333266616436/Tilda_Icons_26sn_tel.svg",
    rel: "noopener nofollow",
  },
  {
    name: "VK",
    url: "https://vk.com/aladin_vanya",
    icon: "https://static.tildacdn.com/tild6365-3063-4138-b037-616331333338/Tilda_Icons_26sn_vk.svg",
    rel: "noopener nofollow",
  },
];

export const contactInfo = {
  booking: {
    name: "Снежана",
    phone: "+7 926 571 36 77",
  },
  pr: {
    email: "aladinteam27@gmail.com",
  },
};

export const latestRelease = {
  title: "Плакала",
  year: "2025",
  type: "Сингл",
  badge: "Новый релиз",
  coverImage: "https://static.tildacdn.com/tild6532-3964-4639-b861-353539336663/cried_cover.png",
  presaveUrl: "https://band.link/plakala",
  listenUrl: "https://band.link/plakala",
};

// Hero images for home page
export const heroImages = {
  desktop: "https://static.tildacdn.com/tild6236-3435-4539-b161-366134643363/desktop.PNG",
  mobile: "https://static.tildacdn.com/tild6632-6563-4664-b435-363763346162/mobil.JPEG",
};

// Music catalog for search
export interface MusicItem {
  id: string;
  title: string;
  year: string;
  type: "Альбом" | "Сингл" | "EP";
  coverImage: string;
  url: string;
  category: "Music";
}

export interface PageItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: "Pages";
}

export type SearchableItem = MusicItem | PageItem;

// Music catalog
export const musicCatalog: MusicItem[] = [
  {
    id: "devochka-vesna",
    title: "Девочка-весна",
    year: "2025",
    type: "Сингл",
    coverImage: "https://static.tildacdn.com/tild3639-3163-4135-b739-303834366466/Devochka_vesna_.png",
    url: "/music/devochka-vesna",
    category: "Music",
  },
  {
    id: "ne-uletay",
    title: "Не улетай",
    year: "2025",
    type: "Сингл",
    coverImage: "https://static.tildacdn.com/tild3661-6164-4232-b961-333830643330/Ne_Uletai_.png",
    url: "/music/ne-uletay",
    category: "Music",
  },
  {
    id: "davay-vali",
    title: "ДАВАЙ ВАЛИ",
    year: "2025",
    type: "Сингл",
    coverImage: "https://static.tildacdn.com/tild6436-6364-4035-b461-366535613730/Davai_vali_.png",
    url: "/music/davay-vali",
    category: "Music",
  },
  {
    id: "opyat-vlyublyonnyy",
    title: "Опять влюблённый",
    year: "2025",
    type: "Сингл",
    coverImage: "https://static.tildacdn.com/tild6237-6236-4561-b133-623661313132/OPYAT_VLYUBLONNYY__1.png",
    url: "/music/opyat-vlyublyonnyy",
    category: "Music",
  },
  {
    id: "plakala",
    title: "Плакала",
    year: "2025",
    type: "Сингл",
    coverImage: "https://static.tildacdn.com/tild6532-3964-4639-b861-353539336663/cried_cover.png",
    url: "/music/plakala",
    category: "Music",
  },
];

// Pages for search
export const pagesCatalog: PageItem[] = [
  {
    id: "home",
    title: "Главная",
    description: "Главная страница сайта Ваня Аладин",
    url: "/",
    category: "Pages",
  },
  {
    id: "music",
    title: "Музыка",
    description: "Все треки и альбомы Вани Аладина",
    url: "/music",
    category: "Pages",
  },
  {
    id: "biography",
    title: "Биография",
    description: "История и биография артиста",
    url: "https://vanyaaladin.com/wiki/aladin-vanya",
    category: "Pages",
  },
  {
    id: "live",
    title: "Даты концертов",
    description: "Расписание выступлений и концертов",
    url: "https://vanyaaladin.com/live",
    category: "Pages",
  },
  {
    id: "contacts",
    title: "Контакты",
    description: "Связаться с командой артиста",
    url: "https://vanyaaladin.com/contacts",
    category: "Pages",
  },
];

// All searchable content
export const getAllSearchableItems = (): SearchableItem[] => {
  return [...musicCatalog, ...pagesCatalog];
};
