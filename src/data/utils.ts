import {
  Coffee,
  UtensilsCrossed,
  CookingPot,
  ChefHat,
  Martini,
  Receipt,
  Droplets,
  Bike,
  SprayCan,
  PartyPopper,
  Salad,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

// ── Display helpers ──
export function maskBusinessName(name: string): string {
  const words = name.trim().split(/\s+/);
  return words.map((w) => w[0] + ".").join(" ");
}

export function maskWorkerName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Role options + icons (icon reflects the type of job) ──
export const ROLE_OPTIONS = [
  "Waiter/Server", "Barista", "Kitchen assistant", "Chef",
  "Bar staff/Bartender", "Host/Cashier", "Dishwasher",
  "Delivery rider", "Cleaning staff", "Event staff", "Catering assistant",
];

export const ROLE_ICONS: Record<string, LucideIcon> = {
  "Waiter/Server": UtensilsCrossed,
  Barista: Coffee,
  "Kitchen assistant": CookingPot,
  Chef: ChefHat,
  "Bar staff/Bartender": Martini,
  "Host/Cashier": Receipt,
  Dishwasher: Droplets,
  "Delivery rider": Bike,
  "Cleaning staff": SprayCan,
  "Event staff": PartyPopper,
  "Catering assistant": Salad,
};

export function roleIcon(role: string): LucideIcon {
  return ROLE_ICONS[role] ?? Briefcase;
}

// ── Availability ──
export const DAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const TIME_SLOT_OPTIONS = [
  "Morning (6–13)",
  "Afternoon (12–18)",
  "Evening (17–23)",
  "Night (22–06)",
];

export const LOOKING_FOR_OPTIONS = [
  { value: "single", label: "Single shifts" },
  { value: "parttime", label: "Part-time" },
];

// ── Languages ──
export const LANGUAGE_OPTIONS = [
  "Portuguese", "English", "Spanish", "French", "Arabic",
  "Mandarin", "Romanian", "Ukrainian", "Hindi", "Other",
];

export const LANGUAGE_LEVELS = [
  "Native", "Fluent (C1/C2)", "Intermediate (B1/B2)", "Basic (A2/B1)",
];

export const LANGUAGE_FLAGS: Record<string, string> = {
  Portuguese: "🇵🇹", English: "🇬🇧", Spanish: "🇪🇸", French: "🇫🇷",
  Arabic: "🇪🇬", Mandarin: "🇨🇳", Romanian: "🇷🇴", Ukrainian: "🇺🇦",
  Hindi: "🇮🇳", Other: "🌐",
};

/**
 * ISO 3166-1 alpha-2 codes used to render real flag images.
 * Emoji flags don't render on Windows/Chrome and many Android builds, so the UI
 * uses <Flag code="pt" /> images instead — this map is the single source.
 */
export const LANGUAGE_FLAG_CODES: Record<string, string> = {
  Portuguese: "pt", English: "gb", Spanish: "es", French: "fr",
  Arabic: "eg", Mandarin: "cn", Romanian: "ro", Ukrainian: "ua",
  Hindi: "in",
};


// ── All Portuguese cities (district capitals + major municipalities + islands) ──
export const CITY_OPTIONS = [
  "Lisbon", "Porto", "Amadora", "Braga", "Setúbal", "Coimbra", "Queluz",
  "Funchal", "Cacém", "Vila Nova de Gaia", "Almada", "Agualva-Cacém",
  "Aveiro", "Barreiro", "Beja", "Bragança", "Castelo Branco", "Évora",
  "Guarda", "Leiria", "Portalegre", "Santarém", "Viana do Castelo",
  "Vila Real", "Viseu", "Faro", "Loulé", "Portimão", "Olhão", "Tavira",
  "Cascais", "Sintra", "Oeiras", "Loures", "Odivelas", "Seixal", "Matosinhos",
  "Maia", "Gondomar", "Valongo", "Guimarães", "Famalicão", "Barcelos",
  "Penafiel", "Póvoa de Varzim", "Vila do Conde", "Espinho", "Águeda",
  "Caldas da Rainha", "Torres Vedras", "Torres Novas", "Tomar", "Abrantes",
  "Figueira da Foz", "Marinha Grande", "Pombal", "Ovar", "São João da Madeira",
  "Vila Real de Santo António", "Lagos", "Albufeira", "Elvas", "Estremoz",
  "Ponta Delgada", "Angra do Heroísmo", "Horta", "Câmara de Lobos", "Machico",
];

// ── Nationalities (broad set, flagged) ──
// `code` is the ISO 3166-1 alpha-2 code used to render a real flag image.
export const NATIONALITY_OPTIONS: { name: string; flag: string; code: string }[] = [
  { name: "Portuguese", flag: "🇵🇹", code: "pt" }, { name: "Brazilian", flag: "🇧🇷", code: "br" },
  { name: "Spanish", flag: "🇪🇸", code: "es" }, { name: "French", flag: "🇫🇷", code: "fr" },
  { name: "Italian", flag: "🇮🇹", code: "it" }, { name: "German", flag: "🇩🇪", code: "de" },
  { name: "British", flag: "🇬🇧", code: "gb" }, { name: "Irish", flag: "🇮🇪", code: "ie" },
  { name: "Dutch", flag: "🇳🇱", code: "nl" }, { name: "Belgian", flag: "🇧🇪", code: "be" },
  { name: "Swiss", flag: "🇨🇭", code: "ch" }, { name: "Austrian", flag: "🇦🇹", code: "at" },
  { name: "Polish", flag: "🇵🇱", code: "pl" }, { name: "Romanian", flag: "🇷🇴", code: "ro" },
  { name: "Bulgarian", flag: "🇧🇬", code: "bg" }, { name: "Ukrainian", flag: "🇺🇦", code: "ua" },
  { name: "Russian", flag: "🇷🇺", code: "ru" }, { name: "Moldovan", flag: "🇲🇩", code: "md" },
  { name: "Hungarian", flag: "🇭🇺", code: "hu" }, { name: "Czech", flag: "🇨🇿", code: "cz" },
  { name: "Slovak", flag: "🇸🇰", code: "sk" }, { name: "Greek", flag: "🇬🇷", code: "gr" },
  { name: "Croatian", flag: "🇭🇷", code: "hr" }, { name: "Serbian", flag: "🇷🇸", code: "rs" },
  { name: "Albanian", flag: "🇦🇱", code: "al" }, { name: "Lithuanian", flag: "🇱🇹", code: "lt" },
  { name: "Latvian", flag: "🇱🇻", code: "lv" }, { name: "Estonian", flag: "🇪🇪", code: "ee" },
  { name: "Swedish", flag: "🇸🇪", code: "se" }, { name: "Norwegian", flag: "🇳🇴", code: "no" },
  { name: "Danish", flag: "🇩🇰", code: "dk" }, { name: "Finnish", flag: "🇫🇮", code: "fi" },
  { name: "Moroccan", flag: "🇲🇦", code: "ma" }, { name: "Algerian", flag: "🇩🇿", code: "dz" },
  { name: "Tunisian", flag: "🇹🇳", code: "tn" }, { name: "Egyptian", flag: "🇪🇬", code: "eg" },
  { name: "Nigerian", flag: "🇳🇬", code: "ng" }, { name: "Ghanaian", flag: "🇬🇭", code: "gh" },
  { name: "Senegalese", flag: "🇸🇳", code: "sn" }, { name: "Angolan", flag: "🇦🇴", code: "ao" },
  { name: "Mozambican", flag: "🇲🇿", code: "mz" }, { name: "Cape Verdean", flag: "🇨🇻", code: "cv" },
  { name: "Guinean", flag: "🇬🇼", code: "gw" }, { name: "South African", flag: "🇿🇦", code: "za" },
  { name: "Kenyan", flag: "🇰🇪", code: "ke" }, { name: "Ethiopian", flag: "🇪🇹", code: "et" },
  { name: "Indian", flag: "🇮🇳", code: "in" }, { name: "Pakistani", flag: "🇵🇰", code: "pk" },
  { name: "Bangladeshi", flag: "🇧🇩", code: "bd" }, { name: "Nepali", flag: "🇳🇵", code: "np" },
  { name: "Sri Lankan", flag: "🇱🇰", code: "lk" }, { name: "Chinese", flag: "🇨🇳", code: "cn" },
  { name: "Japanese", flag: "🇯🇵", code: "jp" }, { name: "South Korean", flag: "🇰🇷", code: "kr" },
  { name: "Filipino", flag: "🇵🇭", code: "ph" }, { name: "Vietnamese", flag: "🇻🇳", code: "vn" },
  { name: "Thai", flag: "🇹🇭", code: "th" }, { name: "Indonesian", flag: "🇮🇩", code: "id" },
  { name: "Turkish", flag: "🇹🇷", code: "tr" }, { name: "Lebanese", flag: "🇱🇧", code: "lb" },
  { name: "Syrian", flag: "🇸🇾", code: "sy" }, { name: "Iranian", flag: "🇮🇷", code: "ir" },
  { name: "Iraqi", flag: "🇮🇶", code: "iq" }, { name: "American", flag: "🇺🇸", code: "us" },
  { name: "Canadian", flag: "🇨🇦", code: "ca" }, { name: "Mexican", flag: "🇲🇽", code: "mx" },
  { name: "Argentine", flag: "🇦🇷", code: "ar" }, { name: "Colombian", flag: "🇨🇴", code: "co" },
  { name: "Venezuelan", flag: "🇻🇪", code: "ve" }, { name: "Peruvian", flag: "🇵🇪", code: "pe" },
  { name: "Chilean", flag: "🇨🇱", code: "cl" }, { name: "Australian", flag: "🇦🇺", code: "au" },
  { name: "Other", flag: "🌍", code: "" },
]

  // Sort alphabetically by the visible nationality name (A→Z),
  // keeping the "Other" catch-all pinned to the end.
  .sort((a, b) => {
    if (a.name === "Other") return 1;
    if (b.name === "Other") return -1;
    return a.name.localeCompare(b.name);
  });
