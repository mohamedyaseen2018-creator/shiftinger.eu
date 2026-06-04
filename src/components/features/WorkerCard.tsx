import { CheckCircle } from "lucide-react";
import type { WorkerProfile } from "@/data/types";
import {
  maskWorkerName,
  getInitials,
  roleIcon,
  NATIONALITY_OPTIONS,
  LANGUAGE_FLAGS,
  DAY_OPTIONS,
} from "@/data/utils";

interface WorkerCardProps {
  worker: WorkerProfile;
  onContact?: (worker: WorkerProfile) => void;
}

export default function WorkerCard({ worker, onContact }: WorkerCardProps) {
  const displayName = maskWorkerName(worker.name);
  const initials = getInitials(worker.name);
  const Icon = roleIcon(worker.mainRole);
  const days = worker.availability?.days ?? [];
  const nationalityFlag =
    NATIONALITY_OPTIONS.find((n) => n.name === worker.nationality)?.flag ?? "🌍";

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 ring-1 ring-ink/5 transition-shadow hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className="flex size-14 items-center justify-center rounded-full bg-teal text-lg font-medium text-canvas">
            {initials}
          </div>
          <span
            className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-ink/5 bg-white text-teal"
            title={worker.mainRole}
          >
            <Icon size={13} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium text-ink">{displayName}</h3>
            {worker.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal px-2 py-0.5 text-[10px] font-medium text-canvas">
                <CheckCircle size={10} /> Verified
              </span>
            )}
          </div>

          {/* Rating */}
          {worker.rating > 0 && worker.shiftsCompleted >= 3 && (
            <div className="mt-0.5 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  viewBox="0 0 16 16"
                  className={`size-3 ${s <= Math.round(worker.rating) ? "fill-gold text-gold" : "fill-current text-ink/15"}`}
                >
                  <path d="M8 1l1.9 3.8 4.2.6-3 2.9.7 4.1L8 10.4l-3.8 2 .7-4.1-3-2.9 4.2-.6z" />
                </svg>
              ))}
              <span className="ml-0.5 text-xs font-medium text-ink">{worker.rating.toFixed(1)}</span>
              <span className="text-xs text-ink/40">· {worker.shiftsCompleted} shifts</span>
            </div>
          )}

          <p className="mt-0.5 text-xs text-ink/50">
            {nationalityFlag} {worker.nationality} · {worker.city}
          </p>
        </div>
      </div>

      {/* Role + years */}
      <div>
        <p className="text-sm font-medium text-ink">
          {worker.mainRole}{" "}
          <span className="font-normal text-ink/50">
            · {worker.mainRoleYears}yr{worker.mainRoleYears !== 1 ? "s" : ""}
          </span>
        </p>
        {worker.subRoles.length > 0 && (
          <p className="mt-0.5 text-xs text-ink/50">
            Also: {worker.subRoles.map((sr) => sr.role).join(", ")}
          </p>
        )}
      </div>

      {/* Languages */}
      {worker.languages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {worker.languages.map((l) => (
            <span
              key={l.language}
              className="flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60 ring-1 ring-ink/10"
            >
              {LANGUAGE_FLAGS[l.language] ?? "🌐"} {l.language}
            </span>
          ))}
        </div>
      )}

      {/* Availability days */}
      {days.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {DAY_OPTIONS.map((d) => (
            <span
              key={d}
              className={`flex size-7 items-center justify-center rounded text-[10px] font-medium ${
                days.includes(d) ? "bg-teal text-canvas" : "bg-ink/5 text-ink/30"
              }`}
            >
              {d[0]}
            </span>
          ))}
        </div>
      )}

      {/* Bio */}
      {worker.bio && (
        <p className="line-clamp-2 text-xs leading-relaxed text-ink/50">{worker.bio}</p>
      )}

      {/* Atividade */}
      {worker.atividade && (
        <span className="w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200">
          ✓ Atividade active
        </span>
      )}

      {/* CTA */}
      <div className="flex items-center justify-between border-t border-ink/5 pt-3">
        <p className="text-xs text-ink/40">Min €{worker.minRate}/hr</p>
        <button
          onClick={() => onContact?.(worker)}
          className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-teal/90"
        >
          View profile
        </button>
      </div>
    </div>
  );
}
