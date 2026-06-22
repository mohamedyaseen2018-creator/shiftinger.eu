import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ROLE_OPTIONS, LANGUAGE_OPTIONS } from "@/data/utils";

export const Route = createFileRoute("/_authenticated/post-job")({
  head: () => ({ meta: [{ title: "Post a shift — Shiftinger" }] }),
  component: PostJobPage,
});

const inputClass =
  "w-full rounded-md border-0 bg-canvas px-3 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-ink">{children}</label>;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

/** Time picker restricted to 15-minute increments (00, 15, 30, 45). */
function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value ? value.split(":") : ["", ""];
  const set = (nh: string, nm: string) => onChange(nh && nm ? `${nh}:${nm}` : "");
  return (
    <div className="flex gap-2">
      <select className={inputClass} value={h} onChange={(e) => set(e.target.value, m || "00")} aria-label="Hour">
        <option value="">HH</option>
        {HOURS.map((x) => (
          <option key={x} value={x}>{x}</option>
        ))}
      </select>
      <select className={inputClass} value={m} onChange={(e) => set(h || "00", e.target.value)} aria-label="Minute">
        <option value="">MM</option>
        {MINUTES.map((x) => (
          <option key={x} value={x}>{x}</option>
        ))}
      </select>
    </div>
  );
}

function PostJobPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [form, setForm] = useState({
    role: "",
    type: "single" as "single" | "parttime",
    date: "",
    startTime: "",
    endTime: "",
    startDate: "",
    endDate: "",
    rate: 0,
    spots: 1,
    atividade: "not-required",
    note: "",
  });

  if (loading) {
    return <SiteLayout><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-teal" /></div></SiteLayout>;
  }

  if (profile?.account_type !== "business") {
    return <SiteLayout><div className="px-6 py-20 text-center text-ink/60">Only business accounts can post shifts.</div></SiteLayout>;
  }

  if (profile.status !== "approved") {
    return <SiteLayout><div className="px-6 py-20 text-center text-ink/60">Your account must be verified before posting shifts.</div></SiteLayout>;
  }

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role || !form.rate) {
      toast.error("Please choose a role and set a pay rate.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("jobs").insert({
      owner_id: user!.id,
      role: form.role,
      type: form.type,
      date: form.type === "single" && form.date ? form.date : null,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      working_days: form.type === "parttime" ? days : [],
      start_date: form.type === "parttime" && form.startDate ? form.startDate : null,
      end_date: form.type === "parttime" && form.endDate ? form.endDate : null,
      rate: Number(form.rate),
      spots: Number(form.spots) || 1,
      spots_remaining: Number(form.spots) || 1,
      languages,
      atividade: form.atividade,
      note: form.note || null,
      status: "open",
    });
    setBusy(false);
    if (error) {
      toast.error("Could not post the shift. Please try again.");
      return;
    }
    toast.success("Shift posted!");
    navigate({ to: "/my-jobs" });
  };

  return (
    <SiteLayout>
      <section className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-teal">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <h1 className="font-serif text-3xl text-ink">Post a shift</h1>
          <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl bg-white p-8 ring-1 ring-ink/5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><Label>Role</Label>
                <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="">Select role</option>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><Label>Type</Label>
                <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "single" | "parttime" })}>
                  <option value="single">Single shift</option>
                  <option value="parttime">Part-time</option>
                </select>
              </div>
            </div>

            {form.type === "single" ? (
              <div className="grid gap-5 sm:grid-cols-3">
                <div><Label>Date</Label><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Start</Label><TimeSelect value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} /></div>
                <div><Label>End</Label><TimeSelect value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} /></div>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><Label>Start date</Label><input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
                  <div><Label>End date</Label><input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Working days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <button key={d} type="button" onClick={() => toggle(days, setDays, d)}
                        className={`rounded-full px-3 py-1 text-xs ring-1 ${days.includes(d) ? "bg-teal text-canvas ring-teal" : "ring-ink/15 text-ink/70"}`}>{d}</button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div><Label>Start time</Label><input type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
                  <div><Label>End time</Label><input type="time" className={inputClass} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
                </div>
              </>
            )}

            <div className="grid gap-5 sm:grid-cols-3">
              <div><Label>Pay (€/hr)</Label><input type="number" min={0} className={inputClass} value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} /></div>
              <div><Label>Spots</Label><input type="number" min={1} className={inputClass} value={form.spots} onChange={(e) => setForm({ ...form, spots: Number(e.target.value) })} /></div>
              <div><Label>Atividade</Label>
                <select className={inputClass} value={form.atividade} onChange={(e) => setForm({ ...form, atividade: e.target.value })}>
                  <option value="not-required">Not required</option>
                  <option value="preferred">Preferred</option>
                  <option value="required">Required</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Languages needed</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((l) => (
                  <button key={l} type="button" onClick={() => toggle(languages, setLanguages, l)}
                    className={`rounded-full px-3 py-1 text-xs ring-1 ${languages.includes(l) ? "bg-teal text-canvas ring-teal" : "ring-ink/15 text-ink/70"}`}>{l}</button>
                ))}
              </div>
            </div>

            <div><Label>Note (optional)</Label><textarea rows={2} className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>

            <button type="submit" disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-teal text-sm font-medium text-canvas hover:bg-teal-light disabled:opacity-50">
              {busy && <Loader2 size={16} className="animate-spin" />} Post shift
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
