import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CITY_OPTIONS, NATIONALITY_OPTIONS, ROLE_OPTIONS, LANGUAGE_OPTIONS } from "@/data/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My profile — Shiftinger" }] }),
  component: ProfilePage,
});

const inputClass =
  "w-full rounded-md border-0 bg-canvas px-3 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-ink">{children}</label>;
}

function ProfilePage() {
  const { user, profile, loading } = useAuth();

  if (loading || !profile || !user) {
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
      <section className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-teal">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <h1 className="font-serif text-3xl text-ink">
            {profile.account_type === "worker" ? "My profile" : "Business profile"}
          </h1>
          <div className="mt-8 rounded-2xl bg-white p-8 ring-1 ring-ink/5">
            {profile.account_type === "worker" ? (
              <WorkerEdit userId={user.id} />
            ) : (
              <BusinessEdit userId={user.id} />
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function WorkerEdit({ userId }: { userId: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("worker_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("worker_contacts").select("phone").eq("user_id", userId).maybeSingle(),
    ]).then(([{ data: wp }, { data: wc }]) => {
      if (wp) setData({ ...wp, phone: (wc?.phone as string) ?? "" });
    });
  }, [userId]);

  if (!data) return <Loader2 className="mx-auto animate-spin text-teal" />;

  const langs = Array.isArray(data.languages)
    ? (data.languages as { language: string }[]).map((l) => l.language)
    : [];

  const setLang = (l: string) => {
    const next = langs.includes(l) ? langs.filter((x) => x !== l) : [...langs, l];
    setData({ ...data, languages: next.map((x) => ({ language: x, level: "Fluent" })) });
  };

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("worker_profiles")
      .update({
        name: data.name as string,
        city: data.city as string,
        nationality: (data.nationality as string) || null,
        phone: data.phone as string,
        main_role: data.main_role as string,
        main_role_years: Number(data.main_role_years) || 0,
        min_rate: Number(data.min_rate) || 0,
        bio: (data.bio as string) || null,
        atividade: Boolean(data.atividade),
        languages: data.languages as { language: string; level: string }[],
        availability_visible: Boolean(data.availability_visible),
        messages_open: Boolean(data.messages_open),
      })
      .eq("user_id", userId);
    setBusy(false);
    if (error) toast.error("Could not save changes.");
    else toast.success("Profile updated.");
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label>Full name</Label><input className={inputClass} value={(data.name as string) ?? ""} onChange={(e) => setData({ ...data, name: e.target.value })} /></div>
        <div><Label>WhatsApp number</Label><input className={inputClass} value={(data.phone as string) ?? ""} onChange={(e) => setData({ ...data, phone: e.target.value })} /></div>
        <div><Label>City</Label>
          <select className={inputClass} value={(data.city as string) ?? ""} onChange={(e) => setData({ ...data, city: e.target.value })}>
            <option value="">Select city</option>
            {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><Label>Nationality</Label>
          <select className={inputClass} value={(data.nationality as string) ?? ""} onChange={(e) => setData({ ...data, nationality: e.target.value })}>
            <option value="">Select nationality</option>
            {NATIONALITY_OPTIONS.map((n) => <option key={n.name} value={n.name}>{n.flag} {n.name}</option>)}
          </select>
        </div>
        <div><Label>Main role</Label>
          <select className={inputClass} value={(data.main_role as string) ?? ""} onChange={(e) => setData({ ...data, main_role: e.target.value })}>
            <option value="">Select role</option>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><Label>Years of experience</Label><input type="number" className={inputClass} value={(data.main_role_years as number) ?? 0} onChange={(e) => setData({ ...data, main_role_years: Number(e.target.value) })} /></div>
        <div><Label>Minimum rate (€/hr)</Label><input type="number" className={inputClass} value={(data.min_rate as number) ?? 0} onChange={(e) => setData({ ...data, min_rate: Number(e.target.value) })} /></div>
      </div>

      <div>
        <Label>Languages</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((l) => (
            <button key={l} type="button" onClick={() => setLang(l)}
              className={`rounded-full px-3 py-1 text-xs ring-1 ${langs.includes(l) ? "bg-teal text-canvas ring-teal" : "ring-ink/15 text-ink/70"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div><Label>Bio</Label><textarea rows={3} className={inputClass} value={(data.bio as string) ?? ""} onChange={(e) => setData({ ...data, bio: e.target.value })} /></div>

      <div className="space-y-3 rounded-xl bg-canvas p-4">
        <ToggleRow label="Visible in 'Find talent'" desc="Businesses can find and contact you." value={Boolean(data.availability_visible)} onChange={(v) => setData({ ...data, availability_visible: v })} />
        <ToggleRow label="Open to messages" desc="Allow businesses to start a conversation." value={Boolean(data.messages_open)} onChange={(v) => setData({ ...data, messages_open: v })} />
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={Boolean(data.atividade)} onChange={(e) => setData({ ...data, atividade: e.target.checked })} />
          I have an open atividade (green receipts)
        </label>
      </div>

      <button onClick={save} disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-teal text-sm font-medium text-canvas hover:bg-teal-light disabled:opacity-50">
        {busy && <Loader2 size={16} className="animate-spin" />} Save changes
      </button>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex w-full items-center justify-between gap-3 text-left">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block text-xs text-ink/50">{desc}</span>
      </span>
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${value ? "bg-teal/10 text-teal" : "bg-ink/5 text-ink/50"}`}>
        {value ? <Eye size={13} /> : <EyeOff size={13} />} {value ? "On" : "Off"}
      </span>
    </button>
  );
}

function BusinessEdit({ userId }: { userId: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("business_profiles").select("*").eq("user_id", userId).maybeSingle()
      .then(({ data }) => setData(data));
    supabase.from("business_locations").select("address").eq("business_id", userId).maybeSingle()
      .then(({ data }) => setAddress((data?.address as string) ?? ""));
  }, [userId]);

  if (!data) return <Loader2 className="mx-auto animate-spin text-teal" />;

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("business_profiles")
      .update({
        business_name: data.business_name as string,
        category: data.category as string,
        city: data.city as string,
        area: (data.area as string) || null,
        phone: data.phone as string,
        description: (data.description as string) || null,
      })
      .eq("user_id", userId);
    await supabase.from("business_locations").upsert({ business_id: userId, address });
    setBusy(false);
    if (error) toast.error("Could not save changes.");
    else toast.success("Business profile updated.");
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label>Business name</Label><input className={inputClass} value={(data.business_name as string) ?? ""} onChange={(e) => setData({ ...data, business_name: e.target.value })} /></div>
        <div><Label>Category</Label><input className={inputClass} value={(data.category as string) ?? ""} onChange={(e) => setData({ ...data, category: e.target.value })} /></div>
        <div><Label>City</Label>
          <select className={inputClass} value={(data.city as string) ?? ""} onChange={(e) => setData({ ...data, city: e.target.value })}>
            <option value="">Select city</option>
            {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><Label>Area</Label><input className={inputClass} value={(data.area as string) ?? ""} onChange={(e) => setData({ ...data, area: e.target.value })} /></div>
        <div><Label>Contact phone</Label><input className={inputClass} value={(data.phone as string) ?? ""} onChange={(e) => setData({ ...data, phone: e.target.value })} /></div>
      </div>
      <div><Label>Exact address (private)</Label><input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
      <div><Label>About</Label><textarea rows={3} className={inputClass} value={(data.description as string) ?? ""} onChange={(e) => setData({ ...data, description: e.target.value })} /></div>
      <button onClick={save} disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-teal text-sm font-medium text-canvas hover:bg-teal-light disabled:opacity-50">
        {busy && <Loader2 size={16} className="animate-spin" />} Save changes
      </button>
    </div>
  );
}
