import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  ShieldCheck,
  Clock,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Check,
  Upload,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { AccountType } from "@/data/types";
import { useAuth } from "@/lib/auth";
import { setAccountType } from "@/lib/onboarding.functions";

import {
  CITY_OPTIONS,
  NATIONALITY_OPTIONS,
  ROLE_OPTIONS,
  LANGUAGE_OPTIONS,
  LANGUAGE_LEVELS,
  LANGUAGE_FLAGS,
  DAY_OPTIONS,
  TIME_SLOT_OPTIONS,
  roleIcon,
} from "@/data/utils";

const BUSINESS_CATEGORIES = [
  "Restaurant",
  "Bar",
  "Café",
  "Catering",
  "Events",
  "Hotel",
  "Bakery",
  "Food truck",
  "Other",
];

const RESIDENCE_OPTIONS = [
  "Portuguese citizen",
  "EU / EEA citizen",
  "Work permit / visa",
  "Student visa",
  "Asylum seeker",
  "Other",
];

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Complete your profile — Shiftinger" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const switchAccountType = useServerFn(setAccountType);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", search: { mode: "signin", role: "worker" } });
      return;
    }
    if (profile && profile.status !== "incomplete") {
      navigate({ to: "/dashboard" });
    }
  }, [loading, user, profile, navigate]);

  // Auto-correct the account type for fresh sign-ups (notably Google, where the
  // chosen role can't pass through OAuth and the DB trigger defaults to worker).
  useEffect(() => {
    if (loading || !profile || profile.status !== "incomplete") return;
    let desired: string | null = null;
    try {
      desired = window.localStorage.getItem("shiftinger:signup_role");
    } catch {
      desired = null;
    }
    if (!desired) return;
    try {
      window.localStorage.removeItem("shiftinger:signup_role");
    } catch {
      /* ignore */
    }
    if (
      (desired === "worker" || desired === "business") &&
      desired !== profile.account_type
    ) {
      void switchAccountType({ data: { accountType: desired } }).then(() => refreshProfile());
    }
  }, [loading, profile, switchAccountType, refreshProfile]);

  const handleSwitch = async (next: AccountType) => {
    if (!profile || next === profile.account_type || switching) return;
    setSwitching(true);
    try {
      await switchAccountType({ data: { accountType: next } });
      await refreshProfile();
      toast.success(next === "business" ? "Switched to a business account." : "Switched to a worker account.");
    } catch {
      toast.error("Could not switch account type. Please try again.");
    } finally {
      setSwitching(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="animate-spin text-teal" />
      </div>
    );
  }

  const isWorker = profile.account_type === "worker";

  return (
    <div className="min-h-screen bg-canvas">
      {/* Minimal header — no app navigation until the profile is complete */}
      <header className="flex items-center justify-between px-6 py-5 lg:px-12">
        <span className="text-xl font-medium tracking-tight">
          <span className="text-teal">Shift</span>
          <span className="font-serif italic text-gold">inger</span>
        </span>
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-1.5 text-sm text-ink/50 transition-colors hover:text-teal"
        >
          <LogOut size={15} /> Sign out
        </button>
      </header>

      <section className="px-4 pb-20 pt-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">
              Almost there
            </span>
            <h1 className="mt-3 font-serif text-3xl text-ink lg:text-4xl">
              Complete your {isWorker ? "worker" : "business"} profile
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
              This builds your profile. After you submit, our team reviews and confirms your
              account before you can browse, post and chat.
            </p>
          </div>

          {/* Account type switcher — only available while the profile is new. */}
          <div className="mx-auto mt-6 max-w-sm">
            <p className="mb-2 text-center text-xs font-medium text-ink/50">
              Wrong account type? Switch below.
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1.5 ring-1 ring-ink/5">
              <button
                type="button"
                onClick={() => handleSwitch("worker")}
                disabled={switching}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  isWorker ? "bg-teal/10 text-teal ring-1 ring-teal" : "text-ink/60 hover:bg-ink/5"
                }`}
              >
                I'm looking for work
              </button>
              <button
                type="button"
                onClick={() => handleSwitch("business")}
                disabled={switching}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  !isWorker ? "bg-gold/10 text-gold-dark ring-1 ring-gold" : "text-ink/60 hover:bg-ink/5"
                }`}
              >
                I'm hiring staff
              </button>
            </div>
          </div>

          <div className="mt-8">
            {isWorker ? (
              <WorkerForm userId={user!.id} email={profile.email} onDone={refreshProfile} />
            ) : (
              <BusinessForm userId={user!.id} email={profile.email} onDone={refreshProfile} />
            )}
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink/50">
            <ShieldCheck size={14} className="text-teal" />
            Your details stay private until you choose to share them.
          </p>
        </div>
      </section>
    </div>
  );
}


/* ──────────────────────────── shared bits ──────────────────────────── */

const inputClass =
  "w-full rounded-md border-0 bg-white px-3 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-ink">{children}</label>;
}

function Stepper({
  steps,
  current,
  accent,
}: {
  steps: string[];
  current: number;
  accent: "teal" | "gold";
}) {
  const activeBg = accent === "teal" ? "bg-teal" : "bg-gold";
  const ring = accent === "teal" ? "ring-teal/20" : "ring-gold/20";
  const line = accent === "teal" ? "bg-teal" : "bg-gold";
  return (
    <div className="mb-8 flex items-center justify-center">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              i < current
                ? `${activeBg} text-canvas`
                : i === current
                  ? `${activeBg} text-canvas ring-4 ${ring}`
                  : "bg-ink/10 text-ink/50"
            }`}
          >
            {i < current ? <CheckCircle size={14} /> : i + 1}
          </div>
          <span
            className={`ml-1.5 hidden text-xs sm:block ${
              i === current ? "font-medium text-ink" : "text-ink/40"
            }`}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <div className={`mx-2 h-px w-6 sm:w-10 ${i < current ? line : "bg-ink/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SubmittedNote() {
  return (
    <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-teal/15">
      <Clock className="mx-auto text-teal" />
      <h3 className="mt-3 font-serif text-xl text-ink">Profile submitted</h3>
      <p className="mt-2 text-sm text-ink/60">
        Thanks! Our team will review and confirm your account. You'll get an email once you're
        verified, and then you can start matching.
      </p>
    </div>
  );
}

/* ──────────────────────────── worker form ──────────────────────────── */

const WORKER_STEPS = ["Account", "Roles", "Experience", "Documents", "Review"];

interface ExpEntry {
  position: string;
  employer: string;
  city: string;
  startDate: string;
  endDate: string;
}
interface LangEntry {
  language: string;
  level: string;
}
interface SubRole {
  role: string;
  years: string;
}

function WorkerForm({
  userId,
  email,
  onDone,
}: {
  userId: string;
  email: string;
  onDone: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const haccpRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [haccpUploading, setHaccpUploading] = useState(false);

  // Account
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+351 ");
  const [nationality, setNationality] = useState("");
  const [city, setCity] = useState("");
  const [residence, setResidence] = useState("");
  // Roles
  const [mainRole, setMainRole] = useState("");
  const [mainRoleYears, setMainRoleYears] = useState("1");
  const [subRoles, setSubRoles] = useState<SubRole[]>([]);
  // Experience + languages
  const [experiences, setExperiences] = useState<ExpEntry[]>([
    { position: "", employer: "", city: "", startDate: "", endDate: "" },
  ]);
  const [languages, setLanguages] = useState<LangEntry[]>([
    { language: "", level: "Fluent (C1/C2)" },
  ]);
  // Documents + extras
  const [atividade, setAtividade] = useState<"yes" | "no">("no");
  const [idDocType, setIdDocType] = useState<string | null>(null);
  const [docPath, setDocPath] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [haccpPath, setHaccpPath] = useState<string | null>(null);
  const [haccpName, setHaccpName] = useState("");
  const [minRate, setMinRate] = useState("");
  const [bio, setBio] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);


  const toggleLookingFor = (v: string) =>
    setLookingFor((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const toggleDay = (v: string) =>
    setDays((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const toggleSlot = (v: string) =>
    setTimeSlots((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const canNext = () => {
    if (step === 0) return name.trim() && city && phone.trim();
    if (step === 1) return Boolean(mainRole);
    return true;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG or PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large — max 5MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "dat";
    const path = `${userId}/id-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("worker-docs").upload(path, file, {
      upsert: true,
    });
    setUploading(false);
    if (error) {
      toast.error("Upload failed. Please try again.");
      return;
    }
    setDocPath(path);
    setDocName(file.name);
    toast.success("Document uploaded.");
  };

  const handleHaccpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG or PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large — max 5MB.");
      return;
    }
    setHaccpUploading(true);
    const ext = file.name.split(".").pop() ?? "dat";
    const path = `${userId}/haccp-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("worker-docs").upload(path, file, {
      upsert: true,
    });
    setHaccpUploading(false);
    if (error) {
      toast.error("Upload failed. Please try again.");
      return;
    }
    setHaccpPath(path);
    setHaccpName(file.name);
    toast.success("Certificate uploaded.");
  };


  const submit = async () => {
    if (!name || !city || !phone) {
      toast.error("Please complete your account details.");
      setStep(0);
      return;
    }
    setBusy(true);
    const { error: cErr } = await supabase
      .from("worker_contacts")
      .upsert({ user_id: userId, phone }, { onConflict: "user_id" });
    if (cErr) {
      setBusy(false);
      toast.error("Could not save your contact details. Please try again.");
      return;
    }
    const { error: wErr } = await supabase
      .from("worker_profiles")
      .update({
        name,
        city,
        nationality: nationality || null,
        residence: residence || null,
        main_role: mainRole,
        main_role_years: Number(mainRoleYears) || 0,
        sub_roles: subRoles.filter((s) => s.role) as unknown as Json,
        experience: experiences.filter((x) => x.position || x.employer) as unknown as Json,
        languages: languages.filter((l) => l.language) as unknown as Json,
        atividade: atividade === "yes",
        min_rate: Number(minRate) || 0,
        bio: bio || null,
        looking_for: lookingFor,
        available_days: days,
        time_slots: timeSlots,
      })
      .eq("user_id", userId);
    if (!wErr && (docPath || haccpPath || idDocType)) {
      await supabase
        .from("worker_documents")
        .upsert(
          {
            user_id: userId,
            id_document_url: docPath ?? undefined,
            id_document_type: idDocType ?? undefined,
            haccp_document_url: haccpPath ?? undefined,
          },
          { onConflict: "user_id" },
        );
    }
    if (wErr) {
      setBusy(false);
      toast.error("Could not save your profile. Please try again.");
      return;
    }
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: name, status: "pending_review" })
      .eq("id", userId);
    setBusy(false);
    if (pErr) {
      toast.error("Could not submit your profile. Please try again.");
      return;
    }
    await onDone();
    setSubmitted(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 2500);
  };

  if (submitted) return <SubmittedNote />;

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5 sm:p-8">
      <Stepper steps={WORKER_STEPS} current={step} accent="teal" />

      {/* Step 0 — Account */}
      {step === 0 && (
        <div className="space-y-5">
          <h2 className="font-serif text-2xl text-ink">Your account</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <input className={inputClass} placeholder="First Last" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>WhatsApp / phone</Label>
              <input className={inputClass} placeholder="+351 9XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Email address</Label>
            <input className={`${inputClass} opacity-60`} value={email} disabled />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nationality</Label>
              <select className={inputClass} value={nationality} onChange={(e) => setNationality(e.target.value)}>
                <option value="">Select…</option>
                {NATIONALITY_OPTIONS.map((n) => (
                  <option key={n.name} value={n.name}>{n.flag} {n.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>City</Label>
              <select className={inputClass} value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Select…</option>
                {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Residence / work status</Label>
            <select className={inputClass} value={residence} onChange={(e) => setResidence(e.target.value)}>
              <option value="">Select…</option>
              {RESIDENCE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Step 1 — Roles */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="font-serif text-2xl text-ink">Your roles</h2>
          <div>
            <Label>Main role</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLE_OPTIONS.map((r) => {
                const Icon = roleIcon(r);
                const active = mainRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMainRole(r)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ring-1 transition-colors ${
                      active ? "bg-teal/5 text-teal ring-teal" : "text-ink/70 ring-ink/10 hover:ring-teal"
                    }`}
                  >
                    <Icon size={15} className="shrink-0" /> {r}
                  </button>
                );
              })}
            </div>
          </div>
          {mainRole && (
            <div>
              <Label>Years experience in {mainRole}</Label>
              <input type="number" min={0} max={40} className={`${inputClass} w-32`} value={mainRoleYears} onChange={(e) => setMainRoleYears(e.target.value)} />
            </div>
          )}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label>Additional roles (optional)</Label>
              <span className="text-xs text-ink/40">{subRoles.length}/3 selected</span>
            </div>
            <p className="mb-2 text-xs text-ink/50">Tap any tile to add it as a secondary role you can work.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ROLE_OPTIONS.filter((r) => r !== mainRole).map((r) => {
                const Icon = roleIcon(r);
                const idx = subRoles.findIndex((s) => s.role === r);
                const active = idx !== -1;
                const atLimit = subRoles.length >= 3;
                return (
                  <div
                    key={r}
                    className={`overflow-hidden rounded-lg ring-1 transition-colors ${
                      active ? "bg-gold/5 ring-2 ring-gold" : "ring-ink/10 hover:ring-teal"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={!active && atLimit}
                      onClick={() => {
                        if (active) setSubRoles(subRoles.filter((s) => s.role !== r));
                        else if (!atLimit) setSubRoles([...subRoles, { role: r, years: "0" }]);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        active ? "font-medium text-ink" : "text-ink/70"
                      }`}
                    >
                      <Icon size={15} className="shrink-0" /> {r}
                      {active && <Check size={14} className="ml-auto shrink-0 text-gold" />}
                    </button>
                    {active && (
                      <label className="flex items-center gap-2 border-t border-gold/25 bg-gold/5 px-3 py-2">
                        <span className="text-xs font-medium text-ink/60">Years</span>
                        <input
                          type="number"
                          min={0}
                          max={40}
                          className="w-16 rounded-md border border-ink/15 bg-white px-2 py-1 text-sm focus:border-gold focus:outline-none"
                          placeholder="0"
                          value={subRoles[idx].years}
                          onChange={(e) => {
                            const u = [...subRoles];
                            u[idx].years = e.target.value;
                            setSubRoles(u);
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Experience + languages */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl text-ink">Experience &amp; languages</h2>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>Work experience</Label>
              <button type="button" onClick={() => setExperiences([...experiences, { position: "", employer: "", city: "", startDate: "", endDate: "" }])} className="flex items-center gap-1 text-xs text-teal hover:underline">
                <Plus size={12} /> Add entry
              </button>
            </div>
            {experiences.map((ex, i) => (
              <div key={i} className="mb-3 space-y-3 rounded-xl p-4 ring-1 ring-ink/10">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Position</Label><input className={inputClass} placeholder="e.g. Waiter" value={ex.position} onChange={(e) => { const u = [...experiences]; u[i].position = e.target.value; setExperiences(u); }} /></div>
                  <div><Label>Employer</Label><input className={inputClass} placeholder="Place name" value={ex.employer} onChange={(e) => { const u = [...experiences]; u[i].employer = e.target.value; setExperiences(u); }} /></div>
                  <div><Label>City</Label><input className={inputClass} value={ex.city} onChange={(e) => { const u = [...experiences]; u[i].city = e.target.value; setExperiences(u); }} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>From</Label><input type="month" className={inputClass} value={ex.startDate} onChange={(e) => { const u = [...experiences]; u[i].startDate = e.target.value; setExperiences(u); }} /></div>
                    <div><Label>To</Label><input type="month" className={inputClass} value={ex.endDate} onChange={(e) => { const u = [...experiences]; u[i].endDate = e.target.value; setExperiences(u); }} /></div>
                  </div>
                </div>
                {experiences.length > 1 && (
                  <button type="button" onClick={() => setExperiences(experiences.filter((_, j) => j !== i))} className="flex items-center gap-1 text-xs text-ink/40 hover:text-red-500"><X size={13} /> Remove</button>
                )}
              </div>
            ))}
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>Languages</Label>
              <button type="button" onClick={() => setLanguages([...languages, { language: "", level: "Fluent (C1/C2)" }])} className="flex items-center gap-1 text-xs text-teal hover:underline">
                <Plus size={12} /> Add language
              </button>
            </div>
            {languages.map((l, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <select className={`${inputClass} flex-1`} value={l.language} onChange={(e) => { const u = [...languages]; u[i].language = e.target.value; setLanguages(u); }}>
                  <option value="">Select language…</option>
                  {LANGUAGE_OPTIONS.map((lang) => <option key={lang} value={lang}>{LANGUAGE_FLAGS[lang] ?? "🌐"} {lang}</option>)}
                </select>
                <select className={`${inputClass} flex-1`} value={l.level} onChange={(e) => { const u = [...languages]; u[i].level = e.target.value; setLanguages(u); }}>
                  {LANGUAGE_LEVELS.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
                </select>
                {languages.length > 1 && (
                  <button type="button" onClick={() => setLanguages(languages.filter((_, j) => j !== i))} className="text-ink/40 hover:text-red-500"><X size={16} /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Documents + extras */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl text-ink">Documents &amp; rate</h2>
          {/* Confirm your identity */}
          <div className="rounded-xl bg-canvas p-5 ring-1 ring-ink/10">
            <h3 className="text-sm font-semibold text-ink">Confirm your identity</h3>
            <p className="mt-1 text-xs text-ink/50">
              We only need to verify that you are who you say you are. Your document is never shared with businesses.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                "Cartão de Cidadão (CC)",
                "Passaporte",
                "Título de Residência",
                "Carta de Condução (Driving licence)",
              ].map((t) => {
                const active = idDocType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setIdDocType(t)}
                    className={`flex items-center gap-2 rounded-lg p-3 text-left text-sm ring-1 transition-colors ${active ? "bg-teal/5 text-teal ring-teal" : "text-ink/70 ring-ink/10 hover:ring-teal"}`}
                  >
                    <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-teal bg-teal" : "border-ink/30"}`}>
                      {active && <Check size={11} className="text-white" />}
                    </span>
                    {t}
                  </button>
                );
              })}
            </div>
            {idDocType && (
              <div className="mt-3">
                <p className="mb-1 text-sm font-medium text-ink">Photo of the front side only</p>
                <p className="mb-2 text-xs text-ink/50">A clear phone photo is fine. We just need to read your name and photo.</p>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleUpload} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-ink/15 p-6 text-center transition-colors hover:border-teal disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 size={20} className="animate-spin text-teal" />
                  ) : docPath ? (
                    <>
                      <CheckCircle size={20} className="text-teal" />
                      <p className="text-sm text-ink">{docName}</p>
                      <p className="text-xs text-ink/40">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="text-ink/40" />
                      <p className="text-sm text-ink/60">Click to upload</p>
                      <p className="text-xs text-ink/40">Max 5 MB · JPG, PNG or PDF</p>
                    </>
                  )}
                </button>
                <div className="mt-3 rounded-lg bg-teal/5 px-3 py-2 text-xs text-teal ring-1 ring-teal/10">
                  We only use this to confirm your identity. It is never visible to businesses or other workers.
                </div>
              </div>
            )}
          </div>

          {/* Food hygiene certificate (optional) */}
          <div className="rounded-xl bg-canvas p-5 ring-1 ring-ink/10">
            <h3 className="text-sm font-semibold text-ink">Food hygiene certificate</h3>
            <p className="mt-1 text-xs text-ink/50">
              Very common in hospitality — if you have one, upload it to unlock your HACCP badge on your profile.
            </p>
            <div className="mt-3">
              <p className="mb-2 text-sm font-medium text-ink">HACCP or food hygiene certificate (optional)</p>
              <input ref={haccpRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleHaccpUpload} />
              <button
                type="button"
                onClick={() => haccpRef.current?.click()}
                disabled={haccpUploading}
                className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-ink/15 p-6 text-center transition-colors hover:border-teal disabled:opacity-50"
              >
                {haccpUploading ? (
                  <Loader2 size={20} className="animate-spin text-teal" />
                ) : haccpPath ? (
                  <>
                    <CheckCircle size={20} className="text-teal" />
                    <p className="text-sm text-ink">{haccpName}</p>
                    <p className="text-xs text-ink/40">Click to replace</p>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-ink/40" />
                    <p className="text-sm text-ink/60">Click to upload</p>
                    <p className="text-xs text-ink/40">Max 5 MB · JPG, PNG or PDF</p>
                  </>
                )}
              </button>
            </div>
          </div>


          <div>
            <Label>Do you have an active Atividade (recibos verdes)?</Label>
            <div className="mt-2 flex gap-3">
              {(["yes", "no"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setAtividade(v)} className={`flex-1 rounded-lg py-3 text-sm font-medium capitalize ring-1 transition-colors ${atividade === v ? "bg-teal/5 text-teal ring-teal" : "text-ink/70 ring-ink/10 hover:ring-teal"}`}>
                  {v === "yes" ? "Yes, I have Atividade" : "No, not currently"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Minimum rate (€/hr)</Label>
              <input type="number" min={0} className={inputClass} value={minRate} onChange={(e) => setMinRate(e.target.value)} />
            </div>
            <div>
              <Label>Looking for</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {[{ k: "single", l: "Single shifts" }, { k: "parttime", l: "Part-time" }].map((o) => (
                  <button key={o.k} type="button" onClick={() => toggleLookingFor(o.k)} className={`rounded-full px-3 py-1.5 text-xs ring-1 transition-colors ${lookingFor.includes(o.k) ? "bg-teal text-canvas ring-teal" : "text-ink/70 ring-ink/15 hover:bg-ink/5"}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Available days</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {DAY_OPTIONS.map((d) => (
                <button key={d} type="button" onClick={() => toggleDay(d)} className={`size-10 rounded-lg text-sm font-medium ring-1 transition-colors ${days.includes(d) ? "bg-teal text-canvas ring-teal" : "text-ink/60 ring-ink/15 hover:ring-teal"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Preferred time slots</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {TIME_SLOT_OPTIONS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSlot(s)} className={`rounded-lg px-3 py-2 text-left text-sm ring-1 transition-colors ${timeSlots.includes(s) ? "bg-teal/5 text-teal ring-teal" : "text-ink/70 ring-ink/10 hover:ring-teal"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Short bio</Label>
            <textarea rows={3} className={inputClass} value={bio} placeholder="Tell businesses about your experience…" onChange={(e) => setBio(e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 4 — Review */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="font-serif text-2xl text-ink">Review &amp; submit</h2>
          <div className="space-y-2 rounded-xl bg-canvas p-5 text-sm ring-1 ring-ink/10">
            <p><span className="font-medium">Name:</span> {name || "—"}</p>
            <p><span className="font-medium">City:</span> {city || "—"}</p>
            <p><span className="font-medium">Main role:</span> {mainRole ? `${mainRole} (${mainRoleYears} yrs)` : "—"}</p>
            <p><span className="font-medium">Languages:</span> {languages.filter((l) => l.language).map((l) => l.language).join(", ") || "—"}</p>
            <p><span className="font-medium">Atividade:</span> {atividade === "yes" ? "✓ Active" : "Not active"}</p>
            <p><span className="font-medium">ID document:</span> {docPath ? "✓ Uploaded" : "Not uploaded"}</p>
          </div>
          <div className="rounded-lg bg-gold/10 px-4 py-3 text-xs text-gold-dark">
            By submitting you agree to our Terms of Service and Privacy Policy.
          </div>
          <button onClick={submit} disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-teal text-sm font-medium text-canvas transition-colors hover:bg-teal-light disabled:opacity-50">
            {busy && <Loader2 size={16} className="animate-spin" />} Submit for review
          </button>
        </div>
      )}

      {/* Nav */}
      {step < WORKER_STEPS.length - 1 && (
        <div className="mt-8 flex justify-between border-t border-ink/5 pt-6">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm text-ink/50 hover:text-ink">
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={() => (canNext() ? setStep(step + 1) : toast.error("Please fill the required fields."))}
            className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2 text-sm font-medium text-canvas transition-colors hover:bg-teal-light"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
      {step === WORKER_STEPS.length - 1 && (
        <div className="mt-8 border-t border-ink/5 pt-6">
          <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm text-ink/50 hover:text-ink">
            <ChevronLeft size={16} /> Back
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── business form ──────────────────────────── */

const BUSINESS_STEPS = ["Business", "Contact", "Review"];

function BusinessForm({
  userId,
  email,
  onDone,
}: {
  userId: string;
  email: string;
  onDone: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const docRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Business
  const [businessName, setBusinessName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [businessPhone, setBusinessPhone] = useState("+351 ");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  // Verification doc
  const [verifyOption, setVerifyOption] = useState<"nif" | "alvara" | null>(null);
  const [docPath, setDocPath] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [showVerifyWarning, setShowVerifyWarning] = useState(false);
  // Social presence
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  // Contact
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("");
  const [phone, setPhone] = useState("+351 ");
  const [description, setDescription] = useState("");

  const toggleCategory = (cat: string) =>
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  const hasSocialLink = Boolean(
    facebookUrl.trim() || instagramUrl.trim() || tiktokUrl.trim() || googleMapsUrl.trim(),
  );
  const hasVerification = Boolean(docPath) || hasSocialLink;

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const okType = ["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(file.type);
    if (!okType) {
      toast.error("Please upload a PDF, JPG or PNG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large — max 5MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "dat";
    const path = `${userId}/verification-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("business-docs").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) {
      toast.error("Upload failed. Please try again.");
      return;
    }
    setDocPath(path);
    setDocName(file.name);
    setShowVerifyWarning(false);
    toast.success("Document uploaded.");
  };

  const canNext = () => {
    if (step === 0) return businessName.trim() && categories.length > 0 && city;
    if (step === 1) return contactName.trim() && phone.trim();
    return true;
  };

  const handleNext = () => {
    if (!canNext()) {
      toast.error("Please fill the required fields.");
      return;
    }
    if (step === 0 && !hasVerification && !showVerifyWarning) {
      setShowVerifyWarning(true);
      return;
    }
    setStep(step + 1);
  };


  const submit = async () => {
    if (!businessName || categories.length === 0 || !city || !phone) {
      toast.error("Please complete the required business details.");
      setStep(0);
      return;
    }
    setBusy(true);
    const { error: bErr } = await supabase
      .from("business_profiles")
      .update({
        business_name: businessName,
        categories,
        category: categories[0],
        city,
        area: area || null,
        description: description || null,
        facebook_url: facebookUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        tiktok_url: tiktokUrl.trim() || null,
        google_maps_url: googleMapsUrl.trim() || null,
      })
      .eq("user_id", userId);
    if (bErr) {
      setBusy(false);
      toast.error("Could not save your profile. Please try again.");
      return;
    }
    const { error: bcErr } = await supabase
      .from("business_contacts")
      .upsert(
        {
          user_id: userId,
          phone: businessPhone.trim() || phone,
          contact_name: contactName || null,
          contact_position: contactPosition || null,
        },
        { onConflict: "user_id" },
      );
    if (bcErr) {
      setBusy(false);
      toast.error("Could not save your contact details. Please try again.");
      return;
    }
    if (docPath) {
      await supabase
        .from("business_documents")
        .upsert(
          { user_id: userId, doc_type: verifyOption, document_url: docPath },
          { onConflict: "user_id" },
        );
    }
    if (address) {
      await supabase.from("business_locations").upsert({ business_id: userId, address });
    }
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: businessName, status: "pending_review" })
      .eq("id", userId);
    setBusy(false);
    if (pErr) {
      toast.error("Could not submit your profile. Please try again.");
      return;
    }
    await onDone();
    setSubmitted(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 2500);
  };

  if (submitted) return <SubmittedNote />;

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-ink/5 sm:p-8">
      <Stepper steps={BUSINESS_STEPS} current={step} accent="gold" />

      {/* Step 0 — Business info */}
      {step === 0 && (
        <div className="space-y-5">
          <h2 className="font-serif text-2xl text-ink">Business details</h2>
          <div>
            <Label>Business name</Label>
            <input className={inputClass} placeholder="e.g. Casa Lisboa" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            <p className="mt-1 text-xs text-ink/40">Public listings show only your initials until a worker is accepted.</p>
          </div>
          <div>
            <Label>Business type (select all that apply)</Label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {BUSINESS_CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`rounded-lg px-3 py-2 text-sm ring-1 transition-colors ${categories.includes(cat) ? "bg-gold/10 text-ink ring-gold" : "text-ink/70 ring-ink/10 hover:ring-gold"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Business phone number</Label>
            <input type="tel" className={inputClass} placeholder="+351 9XX XXX XXX" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>City</Label>
              <select className={inputClass} value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Select…</option>
                {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Neighbourhood / area</Label>
              <input className={inputClass} placeholder="e.g. Bairro Alto" value={area} onChange={(e) => setArea(e.target.value)} />
              <p className="mt-1 text-xs text-ink/40">Shown publicly. Exact address stays private.</p>
            </div>
          </div>
          <div>
            <Label>Exact address (kept private)</Label>
            <input className={inputClass} placeholder="Shared with a worker only after you agree to work" value={address} onChange={(e) => setAddress(e.target.value)} />
            <p className="mt-1 text-xs text-ink/40">Only revealed to a worker once you confirm and agree to work.</p>
          </div>

          {/* Verify your business */}
          <div className="rounded-xl bg-canvas p-5 ring-1 ring-ink/10">
            <h3 className="text-sm font-semibold text-ink">Verify your business</h3>
            <p className="mt-1 text-xs text-ink/50">Upload one document to build trust with workers. Takes under 2 minutes.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {([
                { key: "nif", title: "Business NIF document", sub: "A letter or certificate showing your NIF from AT or your accountant" },
                { key: "alvara", title: "Alvará or licença de utilização", sub: "Your operating licence — often already on file or framed on-site" },
              ] as const).map((opt) => {
                const active = verifyOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setVerifyOption(opt.key)}
                    className={`rounded-lg p-3 text-left ring-1 transition-colors ${active ? "bg-gold/10 ring-gold" : "bg-white ring-ink/10 hover:ring-gold"}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <span className={`flex size-4 items-center justify-center rounded-full border ${active ? "border-gold bg-gold" : "border-ink/30"}`}>
                        {active && <Check size={11} className="text-white" />}
                      </span>
                      {opt.title}
                    </span>
                    <span className="mt-1 block pl-6 text-xs text-ink/50">{opt.sub}</span>
                  </button>
                );
              })}
            </div>
            {verifyOption && (
              <div className="mt-3">
                <input ref={docRef} type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleDocUpload} />
                <button
                  type="button"
                  onClick={() => docRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-ink/15 p-6 text-center transition-colors hover:border-gold disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 size={20} className="animate-spin text-gold" />
                  ) : docPath ? (
                    <>
                      <CheckCircle size={20} className="text-teal" />
                      <p className="text-sm text-ink">{docName}</p>
                      <p className="text-xs text-ink/40">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="text-ink/40" />
                      <p className="text-sm text-ink/60">Click to upload</p>
                      <p className="text-xs text-ink/40">Max 5 MB · PDF, JPG or PNG</p>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Your online presence */}
          <div className="rounded-xl bg-canvas p-5 ring-1 ring-ink/10">
            <h3 className="text-sm font-semibold text-ink">Your online presence</h3>
            <p className="mt-1 text-xs text-ink/50">Add at least one link so workers can find you. Your exact address stays private.</p>
            <div className="mt-3 space-y-3">
              <div>
                <Label>Facebook page URL</Label>
                <input type="url" className={inputClass} placeholder="https://facebook.com/yourbusiness" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
              </div>
              <div>
                <Label>Instagram profile URL</Label>
                <input type="url" className={inputClass} placeholder="https://instagram.com/yourbusiness" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
              </div>
              <div>
                <Label>TikTok profile URL</Label>
                <input type="url" className={inputClass} placeholder="https://tiktok.com/@yourbusiness" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} />
              </div>
              <div>
                <Label>Google Maps link</Label>
                <input type="url" className={inputClass} placeholder="Paste your Google Maps business link" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} />
                <p className="mt-1 text-xs text-ink/40">Open Google Maps → find your business → Share → Copy link</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 1 — Contact */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="font-serif text-2xl text-ink">Contact person</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <input className={inputClass} placeholder="First Last" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div>
              <Label>Position / role</Label>
              <input className={inputClass} placeholder="e.g. Owner, Manager" value={contactPosition} onChange={(e) => setContactPosition(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Email address</Label>
            <input className={`${inputClass} opacity-60`} value={email} disabled />
          </div>
          <div>
            <Label>Contact phone</Label>
            <input className={inputClass} placeholder="+351 9XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>About your business</Label>
            <textarea rows={3} className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 2 — Review */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="font-serif text-2xl text-ink">Review &amp; submit</h2>
          <div className="space-y-2 rounded-xl bg-canvas p-5 text-sm ring-1 ring-ink/10">
            <p><span className="font-medium">Business:</span> {businessName || "—"}</p>
            <p><span className="font-medium">Type:</span> {categories.join(", ") || "—"}</p>
            <p><span className="font-medium">City:</span> {city || "—"} {area ? `· ${area}` : ""}</p>
            <p><span className="font-medium">Contact:</span> {contactName || "—"}{contactPosition ? ` (${contactPosition})` : ""}</p>
          </div>
          <div className="rounded-lg bg-gold/10 px-4 py-3 text-xs text-gold-dark">
            Your exact address is never shown publicly — only shared with a worker after mutual acceptance and confirmation.
          </div>
          <button onClick={submit} disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gold text-sm font-medium text-ink transition-colors hover:bg-gold/90 disabled:opacity-50">
            {busy && <Loader2 size={16} className="animate-spin" />} Submit for review
          </button>
        </div>
      )}

      {/* Nav */}
      {step < BUSINESS_STEPS.length - 1 ? (
        <div className="mt-8 border-t border-ink/5 pt-6">
          {step === 0 && showVerifyWarning && !hasVerification && (
            <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
              Please upload a verification document or add at least one social media link so workers can trust your listing.
            </div>
          )}
          <div className="flex justify-between">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm text-ink/50 hover:text-ink">
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold/90"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 border-t border-ink/5 pt-6">
          <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm text-ink/50 hover:text-ink">
            <ChevronLeft size={16} /> Back
          </button>
        </div>
      )}
    </div>
  );
}
