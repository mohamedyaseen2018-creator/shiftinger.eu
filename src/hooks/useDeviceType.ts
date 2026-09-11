import { useEffect, useState } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

/** SSR-safe synchronous detection. Defaults to "desktop" when no window/navigator. */
export function detectDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isMobileUA = /Android|iPhone|iPod|Mobile/i.test(ua);
  const isNarrow = window.innerWidth < 768;
  if (isMobileUA || isNarrow) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

/**
 * Detects the real device type and updates on resize.
 * Returns "mobile" | "tablet" | "desktop". SSR-safe (starts as "desktop"
 * on the server, then re-evaluates on the client after mount).
 */
export function useDeviceTypeValue(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => detectDeviceType());

  useEffect(() => {
    // Re-evaluate immediately on mount in case SSR defaulted to desktop.
    setDeviceType(detectDeviceType());

    const handleResize = () => {
      const isNarrow = window.innerWidth < 768;
      if (isNarrow) setDeviceType("mobile");
      else if (window.innerWidth < 1024) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceType;
}
