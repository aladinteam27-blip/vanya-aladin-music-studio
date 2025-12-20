export interface Track {
  id: string;
  title: string;
  titleEn: string;
  year: number;
  format: 'Сингл' | 'EP' | 'Альбом';
  coverUrl: string;
  audioPreviewUrl: string;
  slug: string;
}

// Transliteration function for URL slugs
export function transliterate(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '-', '-': '-'
  };
  
  return text
    .toLowerCase()
    .split('')
    .map(char => map[char] || char)
    .join('')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const tracks: Track[] = [
  {
    id: '1',
    title: 'Девочка-весна',
    titleEn: 'Devochka-vesna',
    year: 2025,
    format: 'Сингл',
    coverUrl: 'https://static.tildacdn.com/tild3639-3163-4135-b739-303834366466/Devochka_vesna_.png',
    audioPreviewUrl: 'https://aladinteam27-blip.github.io/vanya-sdn/devochkavesna.wav',
    slug: 'devochka-vesna',
  },
  {
    id: '2',
    title: 'Не улетай',
    titleEn: 'Ne uletay',
    year: 2025,
    format: 'Сингл',
    coverUrl: 'https://static.tildacdn.com/tild3661-6164-4232-b961-333830643330/Ne_Uletai_.png',
    audioPreviewUrl: 'https://aladinteam27-blip.github.io/vanya-sdn/ne_uletai.wav',
    slug: 'ne-uletay',
  },
  {
    id: '3',
    title: 'Опять влюблённый',
    titleEn: 'Opyat vlyublyonnyy',
    year: 2025,
    format: 'Сингл',
    coverUrl: 'https://static.tildacdn.com/tild6237-6236-4561-b133-623661313132/OPYAT_VLYUBLONNYY__1.png',
    audioPreviewUrl: 'https://aladinteam27-blip.github.io/vanya-sdn/opyat_vlyblenny.wav',
    slug: 'opyat-vlyublyonnyy',
  },
  {
    id: '4',
    title: 'Давай вали',
    titleEn: 'Davay vali',
    year: 2025,
    format: 'Сингл',
    coverUrl: 'https://static.tildacdn.com/tild6436-6364-4035-b461-366535613730/Davai_vali_.png',
    audioPreviewUrl: 'https://aladinteam27-blip.github.io/vanya-sdn/davai_vali.wav',
    slug: 'davay-vali',
  },
  {
    id: '5',
    title: 'Плакала',
    titleEn: 'Plakala',
    year: 2025,
    format: 'Сингл',
    coverUrl: 'https://static.tildacdn.com/tild6532-3964-4639-b861-353539336663/cried_cover.png',
    audioPreviewUrl: 'https://aladinteam27-blip.github.io/vanya-sdn/plakala.wav',
    slug: 'plakala',
  },
];
