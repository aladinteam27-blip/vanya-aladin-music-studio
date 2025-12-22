// Site data configuration

export const logoSrc = "https://static.tildacdn.com/tild6566-3531-4636-b337-303332613731/Vanya_Aladin_logo_20.svg";

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
    rel: "noopener nofollow",
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
  year: 2025,
  type: "Сингл",
  listenUrl: "https://band.link/plakala",
  presaveUrl: "https://band.link/plakala",
};
