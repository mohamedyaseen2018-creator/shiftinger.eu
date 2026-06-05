import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Card shell ──
export function Panel({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white p-5 shadow-sm", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-sans text-sm font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ── KPI / stat card ──
export function StatCard({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate">{label}</p>
      <p className="mt-2 font-sans text-2xl font-bold text-ink">{value}</p>
      {delta !== undefined && (
        <div
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            up ? "bg-pine-soft text-pine-dark" : "bg-red-50 text-red-600",
          )}
        >
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(delta)}% <span className="font-normal text-slate">vs last month</span>
        </div>
      )}
    </div>
  );
}

// ── Generic status pill ──
type Tone = "pine" | "amber" | "slate" | "red" | "blue";

const TONES: Record<Tone, string> = {
  pine: "bg-pine-soft text-pine-dark",
  amber: "bg-amber-soft text-amber-dark",
  slate: "bg-mist text-slate",
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-blue-600",
};

export function Pill({ tone = "slate", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "active":
    case "confirmed":
    case "resolved":
      return "pine";
    case "matched":
    case "pending":
    case "open":
      return "amber";
    case "expired":
    case "cancelled":
    case "declined":
      return "red";
    default:
      return "slate";
  }
}

// ── Page header ──
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-sans text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
