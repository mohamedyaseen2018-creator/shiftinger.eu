// Site content provider — loads admin overrides once and merges with defaults.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSiteContent } from "@/lib/siteContent.functions";
import { contentValue } from "@/data/siteContent";

interface SiteContentValue {
  overrides: Record<string, string>;
  /** Returns the override for `key`, or the built-in default. */
  c: (key: string) => string;
}

const Ctx = createContext<SiteContentValue | undefined>(undefined);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    getSiteContent()
      .then((res) => {
        if (active) setOverrides(res.overrides ?? {});
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<SiteContentValue>(
    () => ({ overrides, c: (key: string) => contentValue(overrides, key) }),
    [overrides],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Hook returning a `c(key)` getter that falls back to defaults. */
export function useSiteContent(): SiteContentValue {
  const ctx = useContext(Ctx);
  if (ctx) return ctx;
  // Safe fallback when used outside the provider (e.g. during isolated renders).
  return { overrides: {}, c: (key: string) => contentValue({}, key) };
}
