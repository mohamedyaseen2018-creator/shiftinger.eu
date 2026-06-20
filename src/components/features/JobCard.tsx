import { Lock, Clock, Users, Check, X } from "lucide-react";
import type { Job, MatchCriterion } from "@/data/types";
import { useAuth } from "@/lib/auth";
import { matchColor } from "@/lib/matching";
import { timeAgo, formatDate, roleIcon, LANGUAGE_FLAGS } from "@/data/utils";

interface JobCardProps {
  job: Job;
  matchScore?: number;
  matchCriteria?: MatchCriterion[];
  applied?: boolean;
  onApply?: (jobId: string) => void;
  compact?: boolean;
}

export default function JobCard({ job, matchScore, matchCriteria, applied, onApply, compact }: JobCardProps) {
  const Icon = roleIcon(job.role);
  const { user, profile, isAdmin } = useAuth();
  const totalHours =
    job.startTime && job.endTime
      ? (() => {
          const [sh, sm] = job.startTime.split(":").map(Number);
          const [eh, em] = job.endTime.split(":").map(Number);
          return (eh * 60 + em - (sh * 60 + sm)) / 60;
        })()
      : null;

  // Role-based action area (reads from session, not props)
  let action: React.ReactNode = null;
  if (isAdmin) {
    action = <span className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink/40">Admin view</span>;
  } else if (profile?.account_type === "business") {
    action =
      user?.id === job.businessId ? (
        <span className="rounded-full bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink/40">Posted by you</span>
      ) : null;
  } else if (onApply) {
    action = (
      <button
        onClick={() => onApply(job.id)}
        disabled={applied}
        className="rounded-full bg-teal px-4 py-1.5 text-xs font-medium text-canvas transition-colors hover:bg-teal-light disabled:opacity-50"
      >
        {applied ? "Applied ✓" : "Apply"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-5 ring-1 ring-ink/5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-lg bg-teal/5 text-teal">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-base font-medium leading-tight text-ink">{job.role}</h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink/50">
              <span>{job.businessCategory}</span>
              <span className="text-ink/20">·</span>
              <span className="inline-flex items-center gap-1 rounded bg-ink/5 px-1.5 py-0.5">
                <Lock size={9} /> {[job.area, job.city].filter(Boolean).join(", ") || "—"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-base font-medium text-teal">€{job.rate}/hr</p>
          {totalHours && (
            <p className="mt-0.5 text-xs text-ink/40">
              {totalHours}h · €{(job.rate * totalHours).toFixed(0)}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md bg-gold/5 px-3 py-2 text-xs text-gold-dark ring-1 ring-gold/10">
        <Lock size={12} />
        <span>Exact address shared only after acceptance &amp; confirmation</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
        <span
          className={
            job.type === "single"
              ? "rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700"
              : "rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700"
          }
        >
          {job.type === "single" ? "Single shift" : "Part-time"}
        </span>
        {job.date && (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatDate(job.date)} · {job.startTime}–{job.endTime}
          </span>
        )}
        {job.type === "parttime" && job.workingDays && <span>{job.workingDays.join(", ")}</span>}
        <span className="flex items-center gap-1">
          <Users size={11} />
          {job.spotsRemaining} spot{job.spotsRemaining !== 1 ? "s" : ""} left
        </span>
      </div>

      {!compact && job.languages.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.languages.map((lang) => (
            <span key={lang} className="flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60">
              <span>{LANGUAGE_FLAGS[lang] ?? "🌐"}</span> {lang}
            </span>
          ))}
        </div>
      )}

      {matchScore !== undefined && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-ink/50">Match score</span>
            <span className={`font-medium ${matchColor(matchScore).text}`}>{matchScore}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink/5">
            <div className={`h-full rounded-full ${matchColor(matchScore).bar}`} style={{ width: `${matchScore}%` }} />
          </div>
          {matchCriteria && matchCriteria.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              {matchCriteria.slice(0, 5).map((c, i) => (
                <span key={i} className="flex min-w-0 items-center gap-1.5 text-xs text-ink/70">
                  {c.matched ? (
                    <Check size={12} className="flex-shrink-0 text-[#22c55e]" strokeWidth={3} />
                  ) : (
                    <X size={12} className="flex-shrink-0 text-[#ef4444]" strokeWidth={3} />
                  )}
                  <span className="truncate">{c.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {job.note && !compact && (
        <p className="border-l-2 border-gold pl-2 text-xs italic text-ink/50">"{job.note}"</p>
      )}

      <div className="flex items-center justify-between border-t border-ink/5 pt-2">
        <span className="text-xs text-ink/40" suppressHydrationWarning>
          {timeAgo(job.postedAt)} · {job.applicants} applicant{job.applicants !== 1 ? "s" : ""}
        </span>
        {action}
      </div>
    </div>
  );
}
