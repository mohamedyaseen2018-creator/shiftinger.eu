import { useEffect, useState } from "react";
import { Loader2, Star, FileText, MapPin, Languages, Rocket, Clock, Briefcase, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { WorkerProfile } from "@/data/types";
import { getWorkerPublicDetails } from "@/lib/talent.functions";
import { useAuth } from "@/lib/auth";
import HaccpBadge from "@/components/features/HaccpBadge";
import ShiftOfferModal from "@/components/features/ShiftOfferModal";
import {
  getInitials,
  roleIcon,
  NATIONALITY_OPTIONS,
  LANGUAGE_FLAGS,
  DAY_OPTIONS,
} from "@/data/utils";

interface HistoryRow {
  business: string;
  role: string;
  date: string;
  hours: number | null;
}
interface ReviewRow {
  business: string;
  rating: number;
  comment: string;
  date: string;
}

interface WorkerProfileModalProps {
  worker: WorkerProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWhatsApp: () => void;
  revealing: boolean;
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wide text-ink/50">{children}</h3>;
}

export default function WorkerProfileModal({ worker, open, onOpenChange, onWhatsApp, revealing }: WorkerProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const { user, profile, isAdmin } = useAuth();
  const canOffer = !!user && (profile?.account_type === "business" || isAdmin);

  const Icon = roleIcon(worker.mainRole);
  const initials = getInitials(worker.name);
  const nationality = NATIONALITY_OPTIONS.find((n) => n.name === worker.nationality);
  const days = worker.availability?.days ?? [];
  const slots = worker.availability?.timeSlots ?? [];
  const portfolioUrl = worker.portfolioUrl?.trim() || null;
  const avgReview =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : worker.rating;

  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    getWorkerPublicDetails({ data: { workerId: worker.userId } })
      .then((res) => {
        setHistory(res.history as HistoryRow[]);
        setReviews(res.reviews as ReviewRow[]);
        setLoaded(true);
      })
      .catch(() => setLoaded(true))
      .finally(() => setLoading(false));
  }, [open, loaded, worker.userId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:w-full">
        <DialogHeader className="border-b border-ink/5 p-5 text-left sm:p-6">
          <DialogTitle className="sr-only">Worker profile — {worker.name}</DialogTitle>
          <DialogDescription className="sr-only">Full profile, work history and reviews</DialogDescription>

          {/* ── Section 1: Identity ── */}
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {worker.avatarUrl ? (
                <img src={worker.avatarUrl} alt={worker.name} className="size-16 rounded-full object-cover ring-2 ring-teal/15" />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-teal to-teal/70 text-xl font-semibold text-canvas">
                  {initials}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-ink text-canvas">
                <Icon size={12} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">{worker.name}</h2>
                {worker.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <CheckCircle size={11} /> Verified
                  </span>
                )}
                {worker.haccp && <HaccpBadge />}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink/60">
                <span className="inline-flex items-center gap-1"><MapPin size={12} /> {worker.city || "Portugal"}</span>
                {nationality && <span>{nationality.flag} {nationality.name}</span>}
              </p>
              <p className="mt-1.5 text-sm font-medium text-ink">
                {worker.mainRole}
                {worker.mainRoleYears > 0 && (
                  <span className="font-normal text-ink/50"> · {worker.mainRoleYears} yr{worker.mainRoleYears !== 1 ? "s" : ""} experience</span>
                )}
              </p>
              {worker.subRoles.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {worker.subRoles.map((s) => (
                    <span key={s.role} className="rounded-full bg-teal/8 px-2 py-0.5 text-[11px] font-medium text-teal ring-1 ring-teal/15">
                      {s.role}{s.years > 0 ? ` · ${s.years}y` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {/* Identity extras */}
          <div className="grid gap-3 sm:grid-cols-2">
            {worker.languages.length > 0 && (
              <div className="rounded-xl bg-canvas/60 p-3 ring-1 ring-ink/5">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink/50"><Languages size={13} /> Languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {worker.languages.map((l) => (
                    <span key={l.language} className="rounded-full bg-white px-2 py-0.5 text-xs text-ink/70 ring-1 ring-ink/10">
                      {LANGUAGE_FLAGS[l.language] ?? "🌐"} {l.language}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-xl bg-canvas/60 p-3 ring-1 ring-ink/5">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink/50"><Clock size={13} /> Availability</p>
              {days.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1">
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
              ) : (
                <p className="text-xs text-ink/40">Not specified</p>
              )}
              {slots.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {slots.map((s) => (
                    <span key={s} className="rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-ink/5 px-3 py-1 font-semibold text-ink">€{worker.minRate}/hr <span className="font-normal text-ink/40">minimum</span></span>
            {worker.atividade && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                ✓ Open Atividade
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-ink/50">
              <Rocket size={13} /> Immediate start
            </span>
          </div>

          {/* ── Section 2: About ── */}
          <div>
            <SectionTitle>About</SectionTitle>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              {worker.bio || <span className="italic text-ink/35">No bio added yet.</span>}
            </p>
          </div>

          {/* ── Section 3: Work history ── */}
          <div>
            <SectionTitle>Work history on Shiftinger</SectionTitle>
            {loading ? (
              <div className="mt-3 flex justify-center py-3"><Loader2 size={18} className="animate-spin text-teal" /></div>
            ) : history.length === 0 ? (
              <p className="mt-2 text-sm italic text-ink/35">No completed shifts yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-ink/5 rounded-xl bg-canvas/60 ring-1 ring-ink/5">
                {history.map((h, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-4 py-2.5 text-sm text-ink/70">
                    <Briefcase size={13} className="text-ink/30" />
                    <span className="font-medium text-ink">{h.business}</span>
                    <span className="text-ink/30">·</span>
                    <span>{h.role}</span>
                    <span className="text-ink/30">·</span>
                    <span>{fullDate(h.date)}</span>
                    {h.hours != null && (
                      <>
                        <span className="text-ink/30">·</span>
                        <span>{h.hours}h</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Section 4: Reviews ── */}
          <div>
            <div className="flex items-center justify-between">
              <SectionTitle>Reviews from businesses</SectionTitle>
              {reviews.length > 0 && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  <Star size={14} className="fill-gold text-gold" /> {avgReview.toFixed(1)}
                  <span className="font-normal text-ink/40">/ 5 · {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                </span>
              )}
            </div>
            {loading ? null : reviews.length === 0 ? (
              <p className="mt-2 text-sm italic text-ink/35">No reviews yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {reviews.map((r, i) => (
                  <li key={i} className="rounded-xl bg-canvas/60 p-3.5 ring-1 ring-ink/5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={13} className={n <= r.rating ? "fill-gold text-gold" : "text-ink/15"} />
                        ))}
                      </span>
                      <span className="text-xs text-ink/40">{r.business} · {fullDate(r.date)}</span>
                    </div>
                    {r.comment && <p className="mt-1.5 text-sm text-ink/70">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Section 5: CV / Portfolio ── */}
          <div>
            <SectionTitle>CV / Portfolio</SectionTitle>
            {portfolioUrl ? (
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 transition-colors hover:bg-ink/10"
              >
                <FileText size={14} /> View CV / Portfolio →
              </a>
            ) : (
              <p className="mt-2 inline-block rounded-full bg-ink/5 px-4 py-2 text-sm text-ink/40">No CV uploaded yet</p>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink/5 bg-canvas/40 px-5 py-3.5 sm:px-6">
          <button
            onClick={() => onOpenChange(false)}
            className="mr-auto text-sm text-ink/50 underline-offset-2 hover:underline"
          >
            Close
          </button>
          <button
            onClick={onWhatsApp}
            disabled={revealing}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1eb858] disabled:opacity-50"
          >
            {revealing ? <Loader2 size={14} className="animate-spin" /> : (
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
                <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.5-.3zM12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2z" />
              </svg>
            )}
            Contact via WhatsApp
          </button>
          <button
            onClick={() => navigate({ to: "/post-job" })}
            className="rounded-full bg-teal px-4 py-2 text-xs font-semibold text-canvas transition-colors hover:bg-teal-light"
          >
            Send Shift Offer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
