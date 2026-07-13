import { cn } from "@/lib/utils";

// Self-hosted from /public so it works on any host (no Lovable asset proxy).
const markAsset = { url: "/shiftinger-mark.png" };

export type LogoVariant = "full" | "mark" | "icon";
export type LogoTheme = "light" | "dark" | "amber";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  /** Pixel size of the square mark. For `full` the wordmark scales with it. */
  size?: number;
  className?: string;
}

/** The Shiftinger "S" mark (forest + gold). */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src={markAsset.url}
      width={size}
      height={size}
      alt="Shiftinger"
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

export default function Logo({
  variant = "full",
  theme = "light",
  size,
  className,
}: LogoProps) {
  if (variant === "mark" || variant === "icon") {
    return <LogoMark size={size ?? 32} className={className} />;
  }

  const markSize = size ?? 40;
  const shiftColor = theme === "dark" ? "#FFFFFF" : "#06332A";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={markSize} />
      <span
        className="font-medium tracking-tight leading-none"
        style={{ fontSize: markSize * 0.5 }}
      >
        <span style={{ color: shiftColor, fontWeight: 700 }}>Shift</span>
        <span className="font-serif italic" style={{ color: "#D89733" }}>
          inger
        </span>
      </span>
    </div>
  );
}
