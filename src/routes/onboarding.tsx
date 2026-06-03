import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  CITY_OPTIONS,
  NATIONALITY_OPTIONS,
  ROLE_OPTIONS,
  LANGUAGE_OPTIONS,
} from "@/data/utils";

const BUSINESS_CATEGORIES = [
  "Café / Coffee shop",
  "Restaurant",
  "Bar / Pub",
  "Hotel",
  "Bakery / Pastry",
  "Fast food / Takeaway",
  "Catering",
  "Events / Venue",
  "Cleaning service",
  "Other",
];

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Complete your profile — Shiftinger" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, loading, refreshProfile } = useAuth();

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

  if (loading || !profile) {
    return (
      <SiteLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-teal" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">
              Step 2 of 2
            </span>
            <h1 className="mt-3 font-serif text-3xl text-ink lg:text-4xl">
              Complete your {profile.account_type === "worker" ? "worker" : "business"} profile
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
              This builds your profile. After you submit, our team reviews and confirms your
              account within 48 hours.
            </p>
          </div>

          <div className="mt-10 rounded-2xl bg-white p-8 ring-1 ring-ink/5">
            {profile.account_type === "worker" ? (
              <WorkerForm userId={user!.id} onDone={refreshProfile} />
            ) : (
              <BusinessForm userId={user!.id} onDone={refreshProfile} />
            )}
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink/50">
            <ShieldCheck size={14} className="text-teal" />
            Your details stay private until you choose to share them.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}

const inputClass =
  "w-full rounded-md border-0 bg-canvas px-3 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-ink">{children}</label>;
}

function SubmittedNote() {
  return (
    <div className="rounded-xl bg-teal/5 p-6 text-center ring-1 ring-teal/15">
      <Clock className="mx-auto text-teal" />
      <h3 className="mt-3 font-serif text-xl text-ink">Profile submitted</h3>
      <p className="mt-2 text-sm text-ink/60">
        Thanks! We'll review and confirm your account within 48 hours. You'll get an email once
        you're verified.
      </p>
    </div>
  );
}

function WorkerForm({ userId, onDone }: { userId: string; onDone: () => Promise<void> }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    nationality: "",
    phone: "",
    mainRole: "",
    mainRoleYears: 0,
    bio: "",
    minRate: 0,
    atividade: false,
  });
  const [languages, setLanguages] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  const toggle = (arr: string[], set: (v: string[]) => void, value: string) =>
    set(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.city || !form.mainRole || !form.phone) {
      toast.error("Please fill in name, city, phone and your main role.");
      return;
    }
    setBusy(true);
    const { error: wErr } = await supabase
      .from("worker_profiles")
      .update({
        name: form.name,
        city: form.city,
        nationality: form.nationality || null,
        phone: form.phone,
        main_role: form.mainRole,
        main_role_years: Number(form.mainRoleYears) || 0,
        bio: form.bio || null,
        min_rate: Number(form.minRate) || 0,
        atividade: form.atividade,
        languages: languages.map((l) => ({ language: l, level: "Fluent" })),
        looking_for: lookingFor,
      })
      .eq("user_id", userId);
    if (wErr) {
      setBusy(false);
      toast.error("Could not save your profile. Please try again.");
      return;
    }
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: form.name, status: "pending_review" })
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
    <form className="space-y-5" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Full name</Label>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>WhatsApp number</Label>
          <input className={inputClass} value={form.phone} placeholder="+351 …" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <Label>City</Label>
          <select className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
            <option value="">Select city</option>
            {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label>Nationality</Label>
          <select className={inputClass} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })}>
            <option value="">Select nationality</option>
            {NATIONALITY_OPTIONS.map((n) => <option key={n.name} value={n.name}>{n.flag} {n.name}</option>)}
          </select>
        </div>
        <div>
          <Label>Main role</Label>
          <select className={inputClass} value={form.mainRole} onChange={(e) => setForm({ ...form, mainRole: e.target.value })}>
            <option value="">Select role</option>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <Label>Years of experience</Label>
          <input type="number" min={0} max={50} className={inputClass} value={form.mainRoleYears} onChange={(e) => setForm({ ...form, mainRoleYears: Number(e.target.value) })} />
        </div>
        <div>
          <Label>Minimum rate (€/hr)</Label>
          <input type="number" min={0} className={inputClass} value={form.minRate} onChange={(e) => setForm({ ...form, minRate: Number(e.target.value) })} />
        </div>
      </div>

      <div>
        <Label>Languages</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((l) => (
            <button key={l} type="button" onClick={() => toggle(languages, setLanguages, l)}
              className={`rounded-full px-3 py-1 text-xs ring-1 transition-colors ${languages.includes(l) ? "bg-teal text-canvas ring-teal" : "ring-ink/15 text-ink/70 hover:bg-ink/5"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Looking for</Label>
        <div className="flex flex-wrap gap-2">
          {[{ k: "single", l: "Single shifts" }, { k: "parttime", l: "Part-time" }].map((o) => (
            <button key={o.k} type="button" onClick={() => toggle(lookingFor, setLookingFor, o.k)}
              className={`rounded-full px-3 py-1 text-xs ring-1 transition-colors ${lookingFor.includes(o.k) ? "bg-teal text-canvas ring-teal" : "ring-ink/15 text-ink/70 hover:bg-ink/5"}`}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Short bio</Label>
        <textarea rows={3} className={inputClass} value={form.bio} placeholder="Tell businesses about your experience…" onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" checked={form.atividade} onChange={(e) => setForm({ ...form, atividade: e.target.checked })} />
        I have an open atividade (green receipts / self-employed status)
      </label>

      <button type="submit" disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-teal text-sm font-medium text-canvas transition-colors hover:bg-teal-light disabled:opacity-50">
        {busy && <Loader2 size={16} className="animate-spin" />} Submit for review
      </button>
    </form>
  );
}

function BusinessForm({ userId, onDone }: { userId: string; onDone: () => Promise<void> }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    category: "",
    city: "",
    area: "",
    address: "",
    phone: "",
    description: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.category || !form.city || !form.phone) {
      toast.error("Please fill in business name, category, city and phone.");
      return;
    }
    setBusy(true);
    const { error: bErr } = await supabase
      .from("business_profiles")
      .update({
        business_name: form.businessName,
        category: form.category,
        city: form.city,
        area: form.area || null,
        phone: form.phone,
        description: form.description || null,
      })
      .eq("user_id", userId);
    if (bErr) {
      setBusy(false);
      toast.error("Could not save your profile. Please try again.");
      return;
    }
    if (form.address) {
      await supabase.from("business_locations").upsert({ business_id: userId, address: form.address });
    }
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ full_name: form.businessName, status: "pending_review" })
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
    <form className="space-y-5" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Business name</Label>
          <input className={inputClass} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        </div>
        <div>
          <Label>Category</Label>
          <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Select category</option>
            {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label>City</Label>
          <select className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
            <option value="">Select city</option>
            {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label>Area / neighbourhood</Label>
          <input className={inputClass} value={form.area} placeholder="e.g. Baixa" onChange={(e) => setForm({ ...form, area: e.target.value })} />
        </div>
        <div>
          <Label>Contact phone</Label>
          <input className={inputClass} value={form.phone} placeholder="+351 …" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>

      <div>
        <Label>Exact address (kept private)</Label>
        <input className={inputClass} value={form.address} placeholder="Shared with a worker only after you agree to work" onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <p className="mt-1 text-xs text-ink/40">Only revealed to a worker once you confirm and agree to work.</p>
      </div>

      <div>
        <Label>About your business</Label>
        <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <button type="submit" disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-teal text-sm font-medium text-canvas transition-colors hover:bg-teal-light disabled:opacity-50">
        {busy && <Loader2 size={16} className="animate-spin" />} Submit for review
      </button>
    </form>
  );
}
