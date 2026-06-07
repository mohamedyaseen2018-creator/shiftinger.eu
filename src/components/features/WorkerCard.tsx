import { useState } from "react";
import { CheckCircle, MapPin, Briefcase, Clock, Languages, Rocket, MessageCircle, Star, FileText, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { WorkerProfile } from "@/data/types";
import { useAuth } from "@/lib/auth";
import { getWorkerContact } from "@/lib/talent.functions";
import {
  getInitials,
  roleIcon,
  NATIONALITY_OPTIONS,
  LANGUAGE_FLAGS,
  DAY_OPTIONS,
  LOOKING_FOR_OPTIONS,
} from "@/data/utils";

interface WorkerCardProps {
  worker: WorkerProfile;
  /** Optional in-app chat handler. Falls back to WhatsApp when omitted. */
  onContact?: (worker: WorkerProfile) => void;
}

/** Compact WhatsApp-style time-slot labels for the post body. */
const SLOT_SHORT: Record<string, string> = {
  "Morning (6–13)": "Morning",
  "Afternoon (12–18)": "Afternoon",
  "Evening (17–23)": "Evening",
  "Night (22–06)": "Night",
};

export default function WorkerCard({ worker, onContact }: WorkerCardProps) {
  const initials = getInitials(worker.name);
  const Icon = roleIcon(worker.mainRole);
  const days = worker.availability?.days ?? [];
  const slots = worker.availability?.timeSlots ?? [];
  const lookingFor = worker.availability?.lookingFor ?? [];
  const nationalityFlag =
    NATIONALITY_OPTIONS.find((n) => n.name === worker.nationality)?.flag ?? "🌍";

  const { user, profile, isAdmin } = useAuth();
  const canContact = !!user && (profile?.account_type === "business" || isAdmin);
  const [revealing, setRevealing] = useState(false);
  const revealContact = useServerFn(getWorkerContact);
  const navigate = useNavigate();

  const handleContact = async () => {
    if (!user) {
      navigate({ to: "/auth", search: { mode: "signin", role: "business" } });
      return;
    }
    if (!canContact) {
      toast.error("Sign in as a business to contact this worker");
      return;
    }
    try {
      setRevealing(true);
      const res = await revealContact({ data: { workerId: worker.userId } });
      if (res.whatsappUrl) {
        window.open(res.whatsappUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error("This worker has not shared a contact number");
      }
    } catch {
      toast.error("Could not load contact info. Try again.");
    } finally {
      setRevealing(false);
    }
  };

  const lookingLabels = lookingFor
    .map((v) => LOOKING_FOR_OPTIONS.find((o) => o.value === v)?.label ?? v)
    .filter(Boolean);
  const showRating = worker.rating > 0 && worker.shiftsCompleted >= 3;
  const portfolioUrl = worker.portfolioUrl?.trim() || null;

  return (
    <article className="group overflow-hidden rounded-2xl bg-white ring-1 ring-ink/5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start gap-4 p-5 sm:p-6">
        <div className="relative flex-shrink-0">
          {worker.avatarUrl ? (
            <img
              src={worker.avatarUrl}
              alt={worker.name}
              className="size-16 rounded-full object-cover ring-2 ring-teal/15"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-teal to-teal/70 text-xl font-semibold text-canvas">
              {initials}
            </div>
          )}
          <span
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-ink text-canvas"
            title={worker.mainRole}
          >
            <Icon size={14} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-lg font-semibold text-ink">{worker.name}</h3>
            {worker.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <CheckCircle size={11} /> Verified
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
              <Icon size={12} /> {worker.mainRole}
            </span>
            {lookingLabels.map((l) => (
              <span
                key={l}
                className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-ink/70 ring-1 ring-ink/10"
              >
                {l}
              </span>
            ))}
            {showRating && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
                <Star size={14} className="fill-gold text-gold" /> {worker.rating.toFixed(1)}
                <span className="font-normal text-ink/40">/ 5 · {worker.shiftsCompleted} shifts</span>
              </span>
            )}
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/50">
            <MapPin size={13} /> {nationalityFlag} {worker.city || "Portugal"}
            <span className="text-ink/30">· available now</span>
          </p>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleContact}
          disabled={revealing || (!!user && !canContact)}
          title={!canContact ? "Sign in as a business to contact this worker" : undefined}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {revealing ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
          Hire me
          </button>
        )}
      </div>

      <div className="border-t border-ink/5" />

      {/* ── Body (post content) ── */}
      <div className="space-y-3 p-5 text-sm leading-relaxed sm:p-6">
        {/* Headline */}
        <p className="font-medium text-ink">
          <Icon size={15} className="mb-0.5 mr-1 inline text-teal" />
          {worker.mainRole}
          {worker.mainRoleYears > 0 && (
            <span className="text-ink/50"> · {worker.mainRoleYears} yr{worker.mainRoleYears !== 1 ? "s" : ""}</span>
          )}
        </p>

        {/* Secondary roles + years */}
        {worker.subRoles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink/50">Also works as</span>
            {worker.subRoles.map((s) => (
              <span
                key={s.role}
                className="inline-flex items-center gap-1 rounded-full bg-teal/8 px-2.5 py-0.5 text-xs font-medium text-teal ring-1 ring-teal/15"
              >
                {s.role}
                {s.years > 0 && (
                  <span className="text-teal/60">· {s.years}y</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Looking for */}
        {lookingLabels.length > 0 && (
          <p className="text-ink/70">
            🔍 Looking for{" "}
            <span className="font-semibold text-teal">{lookingLabels.join(" or ")}</span>{" "}
            opportunities in <span className="font-semibold text-ink">{worker.city || "Portugal"}</span>.
          </p>
        )}

        {/* Experience */}
        {worker.mainRoleYears > 0 && (
          <p className="flex items-start gap-2 text-ink/70">
            <Briefcase size={15} className="mt-0.5 flex-shrink-0 text-ink/40" />
            <span>
              {worker.mainRoleYears}+ year{worker.mainRoleYears !== 1 ? "s" : ""} of experience as a{" "}
              {worker.mainRole.toLowerCase()}.
            </span>
          </p>
        )}

        {/* Bio */}
        {worker.bio && <p className="line-clamp-3 text-ink/60">{worker.bio}</p>}

        {/* Availability days */}
        {days.length > 0 && (
          <div className="flex items-center gap-2">
            <Clock size={15} className="flex-shrink-0 text-ink/40" />
            <div className="flex flex-wrap gap-1">
              {DAY_OPTIONS.map((d) => (
                <span
                  key={d}
                  className={`flex size-7 items-center justify-center rounded-md text-[11px] font-semibold ${
                    days.includes(d)
                      ? "bg-teal text-canvas"
                      : "bg-ink/5 text-ink/25"
                  }`}
                >
                  {d[0]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Time slots */}
        {slots.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-7">
            {slots.map((s) => (
              <span
                key={s}
                className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold"
              >
                {SLOT_SHORT[s] ?? s}
              </span>
            ))}
          </div>
        )}

        {/* Languages */}
        {worker.languages.length > 0 && (
          <p className="flex items-center gap-2 text-ink/70">
            <Languages size={15} className="flex-shrink-0 text-ink/40" />
            <span className="flex flex-wrap gap-1.5">
              {worker.languages.map((l) => (
                <span
                  key={l.language}
                  className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60 ring-1 ring-ink/10"
                >
                  {LANGUAGE_FLAGS[l.language] ?? "🌐"} {l.language}
                </span>
              ))}
            </span>
          </p>
        )}

        {/* Atividade / immediate start */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {worker.atividade && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              ✓ Open Atividade
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-ink/50">
            <Rocket size={13} /> Available for immediate start
          </span>
        </div>

        {/* CV / portfolio link */}
        {portfolioUrl && (
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-ink/10 transition-colors hover:bg-ink/10"
          >
            <FileText size={13} /> View CV / portfolio
          </a>
        )}
      </div>

      {/* ── Footer / contact ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 bg-canvas/40 px-5 py-4 sm:px-6">
        <p className="text-sm">
          <span className="font-semibold text-ink">€{worker.minRate}</span>
          <span className="text-ink/40">/hr min</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onContact?.(worker)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ink ring-1 ring-ink/15 transition-colors hover:bg-ink/5"
          >
            <MessageCircle size={15} /> Chat
          </button>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1eb858]"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.5-.3zM12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2z" />
              </svg>
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
