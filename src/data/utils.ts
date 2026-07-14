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
export const NATIONALITY_OPTIONS: { name: string; flag: string }[] = [
  { name: "Portuguese", flag: "🇵🇹" }, { name: "Brazilian", flag: "🇧🇷" },
  { name: "Spanish", flag: "🇪🇸" }, { name: "French", flag: "🇫🇷" },
  { name: "Italian", flag: "🇮🇹" }, { name: "German", flag: "🇩🇪" },
  { name: "British", flag: "🇬🇧" }, { name: "Irish", flag: "🇮🇪" },
  { name: "Dutch", flag: "🇳🇱" }, { name: "Belgian", flag: "🇧🇪" },
  { name: "Swiss", flag: "🇨🇭" }, { name: "Austrian", flag: "🇦🇹" },
  { name: "Polish", flag: "🇵🇱" }, { name: "Romanian", flag: "🇷🇴" },
  { name: "Bulgarian", flag: "🇧🇬" }, { name: "Ukrainian", flag: "🇺🇦" },
  { name: "Russian", flag: "🇷🇺" }, { name: "Moldovan", flag: "🇲🇩" },
  { name: "Hungarian", flag: "🇭🇺" }, { name: "Czech", flag: "🇨🇿" },
  { name: "Slovak", flag: "🇸🇰" }, { name: "Greek", flag: "🇬🇷" },
  { name: "Croatian", flag: "🇭🇷" }, { name: "Serbian", flag: "🇷🇸" },
  { name: "Albanian", flag: "🇦🇱" }, { name: "Lithuanian", flag: "🇱🇹" },
  { name: "Latvian", flag: "🇱🇻" }, { name: "Estonian", flag: "🇪🇪" },
  { name: "Swedish", flag: "🇸🇪" }, { name: "Norwegian", flag: "🇳🇴" },
  { name: "Danish", flag: "🇩🇰" }, { name: "Finnish", flag: "🇫🇮" },
  { name: "Moroccan", flag: "🇲🇦" }, { name: "Algerian", flag: "🇩🇿" },
  { name: "Tunisian", flag: "🇹🇳" }, { name: "Egyptian", flag: "🇪🇬" },
  { name: "Nigerian", flag: "🇳🇬" }, { name: "Ghanaian", flag: "🇬🇭" },
  { name: "Senegalese", flag: "🇸🇳" }, { name: "Angolan", flag: "🇦🇴" },
  { name: "Mozambican", flag: "🇲🇿" }, { name: "Cape Verdean", flag: "🇨🇻" },
  { name: "Guinean", flag: "🇬🇼" }, { name: "South African", flag: "🇿🇦" },
  { name: "Kenyan", flag: "🇰🇪" }, { name: "Ethiopian", flag: "🇪🇹" },
  { name: "Indian", flag: "🇮🇳" }, { name: "Pakistani", flag: "🇵🇰" },
  { name: "Bangladeshi", flag: "🇧🇩" }, { name: "Nepali", flag: "🇳🇵" },
  { name: "Sri Lankan", flag: "🇱🇰" }, { name: "Chinese", flag: "🇨🇳" },
  { name: "Japanese", flag: "🇯🇵" }, { name: "South Korean", flag: "🇰🇷" },
  { name: "Filipino", flag: "🇵🇭" }, { name: "Vietnamese", flag: "🇻🇳" },
  { name: "Thai", flag: "🇹🇭" }, { name: "Indonesian", flag: "🇮🇩" },
  { name: "Turkish", flag: "🇹🇷" }, { name: "Lebanese", flag: "🇱🇧" },
  { name: "Syrian", flag: "🇸🇾" }, { name: "Iranian", flag: "🇮🇷" },
  { name: "Iraqi", flag: "🇮🇶" }, { name: "American", flag: "🇺🇸" },
  { name: "Canadian", flag: "🇨🇦" }, { name: "Mexican", flag: "🇲🇽" },
  { name: "Argentine", flag: "🇦🇷" }, { name: "Colombian", flag: "🇨🇴" },
  { name: "Venezuelan", flag: "🇻🇪" }, { name: "Peruvian", flag: "🇵🇪" },
  { name: "Chilean", flag: "🇨🇱" }, { name: "Australian", flag: "🇦🇺" },
  { name: "Other", flag: "🌍" },
]
  // Sort alphabetically by the visible nationality name (A→Z),
  // keeping the "Other" catch-all pinned to the end.
  .sort((a, b) => {
    if (a.name === "Other") return 1;
    if (b.name === "Other") return -1;
    return a.name.localeCompare(b.name);
  });
