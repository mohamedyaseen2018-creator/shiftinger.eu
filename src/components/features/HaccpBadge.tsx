import { ShieldCheck } from "lucide-react";

/**
 * HACCP certified pill badge. Shown on worker cards and profiles only after an
 * admin marks the worker's food-hygiene certificate as verified.
 */
export default function HaccpBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}
      style={{ backgroundColor: "#E8F4F0", color: "#06332A", borderColor: "#A9CFC4" }}
    >
      <ShieldCheck size={11} /> HACCP certified
    </span>
  );
}
