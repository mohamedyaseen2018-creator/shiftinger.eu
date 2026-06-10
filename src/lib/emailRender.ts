// Shared (client-safe) helpers for rendering email templates with
// {{placeholder}} variables. Used by both the admin preview UI and the server.

export const APP_URL = "https://shiftinger.lovable.app";

/** Replace {{var}} placeholders; unknown vars are left visible. */
export function renderEmailTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => vars[key] ?? `{{${key}}}`);
}

export const SAMPLE_VARS: Record<string, string> = {
  name: "Maria Silva",
  email: "maria@example.com",
  app_url: APP_URL,
};
