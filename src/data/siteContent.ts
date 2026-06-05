// ============================================================================
// Editable site content — default copy + the editor schema.
//
// Every public-facing "key block" has a stable key and a default value. Admins
// override values from the console (/console/content); the public site reads the
// override when present and falls back to the default here.
// ============================================================================

export type FieldType = "text" | "textarea";

export interface ContentField {
  key: string;
  label: string;
  type: FieldType;
}

export interface ContentGroup {
  id: string;
  label: string;
  description: string;
  fields: ContentField[];
}

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: "header",
    label: "Header (navigation)",
    description: "Top navigation labels and call-to-action buttons.",
    fields: [
      { key: "header.nav_jobs", label: "Nav — Jobs link", type: "text" },
      { key: "header.nav_talent", label: "Nav — Talent link", type: "text" },
      { key: "header.nav_business", label: "Nav — Business link", type: "text" },
      { key: "header.cta_signin", label: "Button — Sign in", type: "text" },
      { key: "header.cta_register", label: "Button — Get started", type: "text" },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    description: "Footer tagline, column headings and legal line.",
    fields: [
      { key: "footer.tagline", label: "Tagline", type: "textarea" },
      { key: "footer.col_workers_title", label: "Workers column heading", type: "text" },
      { key: "footer.col_business_title", label: "Business column heading", type: "text" },
      { key: "footer.contact_title", label: "Contact heading", type: "text" },
      { key: "footer.contact_cta", label: "Contact button label", type: "text" },
      { key: "footer.contact_hours", label: "Contact hours note", type: "textarea" },
      { key: "footer.copyright", label: "Copyright line", type: "text" },
    ],
  },
  {
    id: "home",
    label: "Home page",
    description: "Hero and the main sections of the landing page.",
    fields: [
      { key: "home.banner", label: "Top banner", type: "text" },
      { key: "home.hero_eyebrow", label: "Hero eyebrow", type: "text" },
      { key: "home.hero_title", label: "Hero title", type: "text" },
      { key: "home.hero_subtitle", label: "Hero subtitle", type: "textarea" },
      { key: "home.hero_cta_primary", label: "Hero primary button", type: "text" },
      { key: "home.hero_cta_secondary", label: "Hero secondary button", type: "text" },
      { key: "home.how_title", label: "How-it-works title", type: "text" },
      { key: "home.how_subtitle", label: "How-it-works subtitle", type: "textarea" },
      { key: "home.privacy_title", label: "Privacy section title", type: "text" },
      { key: "home.privacy_body", label: "Privacy section body", type: "textarea" },
      { key: "home.shifts_title", label: "Shifts section title", type: "text" },
      { key: "home.shifts_subtitle", label: "Shifts section subtitle", type: "text" },
      { key: "home.talent_title", label: "Talent section title", type: "text" },
      { key: "home.talent_subtitle", label: "Talent section subtitle", type: "text" },
    ],
  },
  {
    id: "why",
    label: "For businesses page",
    description: "The \"Why Shiftinger\" / for-businesses page blocks.",
    fields: [
      { key: "why.hero_eyebrow", label: "Hero eyebrow", type: "text" },
      { key: "why.hero_title", label: "Hero title", type: "text" },
      { key: "why.hero_subtitle", label: "Hero subtitle", type: "textarea" },
      { key: "why.hero_cta_primary", label: "Hero primary button", type: "text" },
      { key: "why.hero_cta_secondary", label: "Hero secondary button", type: "text" },
      { key: "why.process_title", label: "Process section title", type: "text" },
      { key: "why.features_title", label: "Features section title", type: "text" },
      { key: "why.features_cta", label: "Features button label", type: "text" },
    ],
  },
];

export const CONTENT_DEFAULTS: Record<string, string> = {
  // Header
  "header.nav_jobs": "Jobs available",
  "header.nav_talent": "Find talent",
  "header.nav_business": "For businesses",
  "header.cta_signin": "Sign in",
  "header.cta_register": "Get started",
  // Footer
  "footer.tagline":
    "Connecting workers and businesses across Portugal. Flexible, fair, and private by design.",
  "footer.col_workers_title": "For workers",
  "footer.col_business_title": "For businesses",
  "footer.contact_title": "Contact us",
  "footer.contact_cta": "Chat on WhatsApp",
  "footer.contact_hours":
    "Available Mon–Sat, 09:00–20:00 (Lisbon time). Response within 2 hours.",
  "footer.copyright":
    "© 2025 Shiftinger. All rights reserved. Built for Portugal's flexible workforce.",
  // Home
  "home.banner": "First 500 workers & 100 businesses — free of charge",
  "home.hero_eyebrow": "Portugal's flexible work platform",
  "home.hero_title": "Find shifts. Find talent. Build your income.",
  "home.hero_subtitle":
    "Shiftinger connects immigrants, students, and career-changers with restaurants, cafés, and event businesses across Portugal. Work by shift, grow at your pace.",
  "home.hero_cta_primary": "I'm looking for work",
  "home.hero_cta_secondary": "I need workers",
  "home.how_title": "Simple for both sides",
  "home.how_subtitle":
    "Whether you're looking for extra income or need reliable staff on short notice — the process takes minutes.",
  "home.privacy_title": "Your location is never public",
  "home.privacy_body":
    "We built privacy into the core of Shiftinger. Businesses post shifts without exposing where they are. Workers apply without knowing the exact address. Location is shared only in the private chat, after a worker is accepted and confirms attendance.",
  "home.shifts_title": "Shifts open now",
  "home.shifts_subtitle": "Browse the latest posted shifts across Lisbon, Porto, and beyond.",
  "home.talent_title": "Talent available today",
  "home.talent_subtitle": "Verified, skill-matched workers ready for shifts across Portugal.",
  // Why
  "why.hero_eyebrow": "For businesses",
  "why.hero_title": "Post a shift tonight. Have someone confirmed by morning.",
  "why.hero_subtitle":
    "No agencies, no long contracts, no placement fees. Shiftinger connects you directly with verified, skill-matched workers across Portugal — in hours, not days.",
  "why.hero_cta_primary": "Register your business",
  "why.hero_cta_secondary": "Browse available workers",
  "why.process_title": "From post to confirmed in hours",
  "why.features_title": "Everything you need to hire faster",
  "why.features_cta": "Get started — it's free",
};

export function contentValue(overrides: Record<string, string>, key: string): string {
  const v = overrides[key];
  return v !== undefined && v !== null ? v : CONTENT_DEFAULTS[key] ?? "";
}

export const ALL_CONTENT_KEYS = Object.keys(CONTENT_DEFAULTS);
