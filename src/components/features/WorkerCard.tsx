import { useState } from "react";
import { CheckCircle, MapPin, Clock, Languages, Rocket, Star, Loader2, User } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { WorkerProfile } from "@/data/types";
import { useAuth } from "@/lib/auth";
import { getWorkerContact } from "@/lib/talent.functions";
import WorkerProfileModal from "@/components/features/WorkerProfileModal";
import {
  getInitials,
  roleIcon,
  NATIONALITY_OPTIONS,
  LANGUAGE_FLAGS,
  DAY_OPTIONS,
} from "@/data/utils";

interface WorkerCardProps {
  worker: WorkerProfile;
}

/** Compact WhatsApp-style time-slot labels. */
const SLOT_SHORT: Record<string, string> = {
  "Morning (6–13)": "Morning",
  "Afternoon (12–18)": "Afternoon",
  "Evening (17–23)": "Evening",
  "Night (22–06)": "Night",
};

export default function WorkerCard({ worker }: WorkerCardProps) {
  const initials = getInitials(worker.name);
  const Icon = roleIcon(worker.mainRole);
  const days = worker.availability?.days ?? [];
  const slots = worker.availability?.timeSlots ?? [];
  const lookingFor = worker.availability?.lookingFor ?? [];
  const nationality = NATIONALITY_OPTIONS.find((n) => n.name === worker.nationality);

  const { user, profile, isAdmin } = useAuth();
  const canContact = !!user && (profile?.account_type === "business" || isAdmin);
  const [revealing, setRevealing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const revealContact = useServerFn(getWorkerContact);
  const navigate = useNavigate();

  const handleWhatsApp = async () => {
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
        const text = encodeURIComponent(
          `Hi ${worker.name}, I found your profile on Shiftinger and I'd like to discuss a shift opportunity.`,
        );
        window.open(`${res.whatsappUrl}?text=${text}`, "_blank", "noopener,noreferrer");
      } else {
        toast.error("This worker has not shared a contact number");
      }
    } catch {
      toast.error("Could not load contact info. Try again.");
    } finally {
      setRevealing(false);
    }
  };

  const showRating = worker.rating > 0 && worker.shiftsCompleted >= 3;

  return (
    <article className="group flex h-full min-h-96 flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-ink/5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* ── Row 1: avatar + name + verified ── */}
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            {worker.avatarUrl ? (
              <img
                src={worker.avatarUrl}
                alt={worker.name}
                className="size-14 rounded-full object-cover ring-2 ring-teal/15"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-teal to-teal/70 text-lg font-semibold text-canvas">
                {initials}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-ink text-canvas"
              title={worker.mainRole}
            >
              <Icon size={12} />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-[15px] font-bold text-ink">{worker.name}</h3>
              {worker.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle size={11} /> Verified
                </span>
              )}
            </div>

            {/* ── Row 2: role + availability-type badges ── */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
                <Icon size={12} /> {worker.mainRole}
              </span>
              {lookingFor.includes("single") && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">Single shifts</span>
              )}
              {lookingFor.includes("parttime") && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Part-time</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 3: rating · city · nationality ── */}
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-ink/60">
          {showRating && (
            <>
              <span className="inline-flex items-center gap-1 font-semibold text-ink">
                <Star size={13} className="fill-gold text-gold" /> {worker.rating.toFixed(1)} / 5
                <span className="font-normal text-ink/40">· {worker.shiftsCompleted} shifts</span>
              </span>
              <span className="text-ink/25">·</span>
            </>
          )}
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {worker.city || "Portugal"}
          </span>
          {nationality && (
            <>
              <span className="text-ink/25">·</span>
              <span>{nationality.flag} {nationality.name}</span>
            </>
          )}
        </p>

        {/* ── Row 4: main role experience + secondary roles ── */}
        <div className="text-[13px]">
          <p className="font-medium text-ink">
            {worker.mainRole}
            {worker.mainRoleYears > 0 && (
              <span className="font-normal text-ink/50">
                {" "}· {worker.mainRoleYears} yr{worker.mainRoleYears !== 1 ? "s" : ""} experience
              </span>
            )}
          </p>
          {worker.subRoles.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-ink/50">Also works as</span>
              {worker.subRoles.map((s) => (
                <span
                  key={s.role}
                  className="rounded-full bg-teal/8 px-2 py-0.5 text-[11px] font-medium text-teal ring-1 ring-teal/15"
                >
                  {s.role}{s.years > 0 ? ` · ${s.years}y` : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Row 5: availability days + time slots ── */}
        {days.length > 0 && (
          <div className="flex items-start gap-2">
            <Clock size={14} className="mt-0.5 flex-shrink-0 text-ink/40" />
            <div>
              <div className="flex flex-wrap gap-1">
                {DAY_OPTIONS.map((d) => (
                  <span
                    key={d}
                    className={`flex size-6 items-center justify-center rounded text-[10px] font-semibold ${
                      days.includes(d) ? "bg-teal text-canvas" : "bg-ink/5 text-ink/25"
                    }`}
                  >
                    {d[0]}
                  </span>
                ))}
              </div>
              {slots.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {slots.map((s) => (
                    <span key={s} className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold">
                      {SLOT_SHORT[s] ?? s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Row 6: languages ── */}
        {worker.languages.length > 0 && (
          <p className="flex items-center gap-2">
            <Languages size={14} className="flex-shrink-0 text-ink/40" />
            <span className="flex flex-wrap gap-1.5">
              {worker.languages.map((l) => (
                <span
                  key={l.language}
                  className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/60 ring-1 ring-ink/10"
                >
                  {LANGUAGE_FLAGS[l.language] ?? "🌐"} {l.language}
                </span>
              ))}
            </span>
          </p>
        )}

        {/* ── Row 7: atividade + immediate start ── */}
        <div className="flex flex-wrap items-center gap-2">
          {worker.atividade && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              ✓ Open Atividade
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-ink/50">
            <Rocket size={12} /> Immediate start
          </span>
        </div>
      </div>

      {/* ── Footer: rate + CTAs ── */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-ink/5 bg-canvas/40 px-4 py-3">
        <p className="text-sm">
          <span className="font-semibold text-ink">€{worker.minRate}</span>
          <span className="text-ink/40">/hr min</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleWhatsApp}
            disabled={revealing || (!!user && !canContact)}
            title={!canContact ? "Sign in as a business to contact this worker" : undefined}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1eb858] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {revealing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.5-.3zM12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2z" />
              </svg>
            )}
            WhatsApp
          </button>
          <button
            onClick={() => setProfileOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-teal ring-1 ring-teal/30 transition-colors hover:bg-teal/5"
          >
            <User size={14} /> View Profile
          </button>
        </div>
      </div>

      <WorkerProfileModal
        worker={worker}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onWhatsApp={handleWhatsApp}
        revealing={revealing}
      />
    </article>
  );
}
