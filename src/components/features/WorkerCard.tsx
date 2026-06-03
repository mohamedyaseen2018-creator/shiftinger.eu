import { CheckCircle, Star, MapPin } from "lucide-react";
import type { WorkerProfile } from "@/data/types";
import { maskWorkerName, getInitials, roleIcon, NATIONALITY_OPTIONS } from "@/data/utils";

export default function WorkerCard({ worker }: { worker: WorkerProfile }) {
  const displayName = maskWorkerName(worker.name);
  const initials = getInitials(worker.name);
  const Icon = roleIcon(worker.mainRole);
  const days = worker.availability?.days ?? [];
  const nationalityFlag =
    NATIONALITY_OPTIONS.find((n) => n.name === worker.nationality)?.flag ?? "🌍";

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 ring-1 ring-ink/5 transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className="flex size-14 items-center justify-center rounded-full bg-teal text-lg font-medium text-canvas">
            {initials}
          </div>
          <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-ink/5 bg-white text-teal">
            <Icon size={13} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-ink">{displayName}</h3>
            {worker.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal px-2 py-0.5 text-[10px] font-medium text-canvas">
                <CheckCircle size={10} /> Verified
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-ink/60">{worker.mainRole}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/40">
            <MapPin size={11} /> {worker.city} · <span>{nationalityFlag} {worker.nationality}</span>
          </p>
        </div>
        {worker.rating > 0 && (
          <div className="flex flex-shrink-0 items-center gap-1 text-xs font-medium text-ink">
            <Star size={12} className="fill-gold text-gold" /> {worker.rating.toFixed(1)}
          </div>
        )}
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-ink/60">{worker.bio}</p>

      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-teal/5 px-2 py-0.5 text-xs text-teal ring-1 ring-teal/15">
          {worker.mainRole} · {worker.mainRoleYears}y
        </span>
        {worker.subRoles.map((sr) => (
          <span key={sr.role} className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60">
            {sr.role}
          </span>
        ))}
      </div>

      {days.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-ink/5 pt-3 text-xs text-ink/50">
          <span className="font-medium text-ink/70">Available:</span>
          {days.join(", ")}
          <span className="ml-auto font-medium text-teal">from €{worker.minRate}/hr</span>
        </div>
      )}
    </div>
  );
}
