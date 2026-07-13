import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: { mark: "h-8", text: "text-xl" },
  md: { mark: "h-10", text: "text-2xl" },
  lg: { mark: "h-12", text: "text-3xl" },
  xl: { mark: "h-16", text: "text-4xl" },
};

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const { mark, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src="/shiftinger-mark.png"
        alt="Shiftinger"
        className={cn(mark, "w-auto object-contain")}
      />
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", text)}>
          Shiftinger
        </span>
      )}
    </div>
  );
}
