import { cn } from "@/lib/utils";

const MARK_SRC = "/shiftinger-mark.png";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 36, className }: LogoMarkProps) {
  return (
    <img
      src={MARK_SRC}
      alt="Shiftinger"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      style={{ height: size, width: size }}
    />
  );
}

interface LogoProps {
  variant?: "full" | "mark";
  theme?: "light" | "dark";
  size?: number;
  className?: string;
}

export default function Logo({
  variant = "full",
  theme = "light",
  size = 40,
  className,
}: LogoProps) {
  if (variant === "mark") {
    return <LogoMark size={size} className={className} />;
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span
        className={cn(
          "font-serif font-semibold tracking-tight",
          theme === "dark" ? "text-white" : "text-ink",
        )}
        style={{ fontSize: Math.round(size * 0.55) }}
      >
        Shiftinger
      </span>
    </span>
  );
}
