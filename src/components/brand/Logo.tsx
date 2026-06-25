import { cn } from "@/lib/utils";

export type LogoVariant = "full" | "mark" | "icon";
export type LogoTheme = "light" | "dark" | "amber";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  /** Pixel size. For `full` this is the icon/symbol height; for `mark`/`icon` it is the square size. */
  size?: number;
  className?: string;
}

interface MarkColors {
  iconBg: string;
  tallBar: string;
  shortBar: string;
  shortBarOpacity: number;
  stub: string;
  stubOpacity: number;
}

function fullThemeColors(theme: LogoTheme): MarkColors & {
  shiftText: string;
  ingerText: string;
  tagline: string;
} {
  switch (theme) {
    case "dark":
      return {
        iconBg: "#D89733",
        tallBar: "#06332A",
        shortBar: "#06332A",
        shortBarOpacity: 0.8,
        stub: "#06332A",
        stubOpacity: 0.4,
        shiftText: "#FFFFFF",
        ingerText: "#D89733",
        tagline: "#A9CFC4",
      };
    case "amber":
      return {
        iconBg: "#06332A",
        tallBar: "#D89733",
        shortBar: "#FFFFFF",
        shortBarOpacity: 0.9,
        stub: "#FFFFFF",
        stubOpacity: 0.4,
        shiftText: "#06332A",
        ingerText: "#06332A",
        tagline: "#0A4A3A",
      };
    case "light":
    default:
      return {
        iconBg: "#06332A",
        tallBar: "#D89733",
        shortBar: "#FFFFFF",
        shortBarOpacity: 0.9,
        stub: "#FFFFFF",
        stubOpacity: 0.4,
        shiftText: "#06332A",
        ingerText: "#D89733",
        tagline: "#486962",
      };
  }
}

/** The two-bar symbol drawn inside a 48x48 viewBox group. */
function MarkSymbol({
  tallBar,
  shortBar,
  shortBarOpacity,
  stub,
  stubOpacity,
}: Omit<MarkColors, "iconBg">) {
  return (
    <>
      <rect x="9" y="12" width="11" height="24" rx="4" fill={tallBar} />
      <rect
        x="23"
        y="12"
        width="11"
        height="17"
        rx="4"
        fill={shortBar}
        opacity={shortBarOpacity}
      />
      <rect x="23" y="32" width="11" height="4" rx="3" fill={stub} opacity={stubOpacity} />
    </>
  );
}

function FullLogo({ theme, size, className }: { theme: LogoTheme; size: number; className?: string }) {
  const c = fullThemeColors(theme);
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="48" height="48" rx="12" fill={c.iconBg} />
        <MarkSymbol
          tallBar={c.tallBar}
          shortBar={c.shortBar}
          shortBarOpacity={c.shortBarOpacity}
          stub={c.stub}
          stubOpacity={c.stubOpacity}
        />
      </svg>
      <div className="leading-none">
        <span style={{ fontSize: size * 0.46 }} className="font-sans tracking-tight">
          <span style={{ color: c.shiftText, fontWeight: 700 }}>Shift</span>
          <span style={{ color: c.ingerText, fontWeight: 300 }}>inger</span>
        </span>
        <p
          className="mt-1"
          style={{
            color: c.tagline,
            fontSize: 10,
            letterSpacing: "0.06em",
            fontWeight: 500,
          }}
        >
          Shift work marketplace · Portugal
        </p>
      </div>
    </div>
  );
}

function MarkLogo({ theme, size, className }: { theme: LogoTheme; size: number; className?: string }) {
  const dark = theme === "dark";
  const colors = dark
    ? { tallBar: "#FAC775", shortBar: "#FFFFFF", shortBarOpacity: 1, stub: "#FFFFFF", stubOpacity: 0.35 }
    : { tallBar: "#1D9E75", shortBar: "#FAC775", shortBarOpacity: 1, stub: "#9FE1CB", stubOpacity: 1 };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <MarkSymbol {...colors} />
    </svg>
  );
}

function IconLogo({ size, className }: { size: number; className?: string }) {
  const radius = size / 6;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx={(radius / size) * 48} fill="#1D9E75" />
      <rect x="13" y="12" width="9" height="24" rx="3" fill="#FAC775" />
      <rect x="26" y="12" width="9" height="17" rx="3" fill="#FFFFFF" opacity="0.95" />
      <rect x="26" y="32" width="9" height="4" rx="2" fill="#FFFFFF" opacity="0.4" />
    </svg>
  );
}

export default function Logo({
  variant = "full",
  theme = "light",
  size,
  className,
}: LogoProps) {
  if (variant === "mark") {
    return <MarkLogo theme={theme} size={size ?? 32} className={className} />;
  }
  if (variant === "icon") {
    return <IconLogo size={size ?? 32} className={className} />;
  }
  return <FullLogo theme={theme} size={size ?? 40} className={className} />;
}
