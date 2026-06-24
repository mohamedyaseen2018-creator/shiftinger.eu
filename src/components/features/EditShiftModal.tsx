import { useState } from "react";
import { Loader2, X, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_OPTIONS, LANGUAGE_OPTIONS } from "@/data/utils";

export interface ShiftRow {
  id: string;
  role: string;
  type: "single" | "parttime";
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  working_days: unknown;
  start_date: string | null;
  end_date: string | null;
  rate: number;
  spots: number;
  spots_remaining: number;
  languages: unknown;
  atividade: string;
  note: string | null;
  status: string;
}

const inputClass =
  "w-full rounded-md border-0 bg-canvas px-3 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-ink">{children}</label>;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

/** Time picker restricted to 15-minute increments. */
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

/** Coerce a languages value (strings or {language} objects) to string[]. */
function normLangs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      typeof item === "string"
        ? item
        : item && typeof item === "object" && "language" in item
          ? String((item as { language: unknown }).language ?? "")
          : "",
    )
    .filter((l) => l.length > 0);
}

export default function EditShiftModal({
  shift,
  onClose,
  onSaved,
}: {
  shift: ShiftRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [languages, setLanguages] = useState<string[]>(normLangs(shift.languages));
  const [days, setDays] = useState<string[]>(Array.isArray(shift.working_days) ? (shift.working_days as string[]) : []);
  const [form, setForm] = useState({
    role: shift.role,
    type: shift.type,
    date: shift.date ?? "",
    startTime: shift.start_time?.slice(0, 5) ?? "",
    endTime: shift.end_time?.slice(0, 5) ?? "",
    startDate: shift.start_date ?? "",
    endDate: shift.end_date ?? "",
    rate: Number(shift.rate),
    spots: shift.spots,
    atividade: shift.atividade,
    note: shift.note ?? "",
  });

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role || !form.rate) {
      toast.error("Please choose a role and set a pay rate.");
      return;
    }
    setBusy(true);
    const spotsNum = Number(form.spots) || 1;
    const newRemaining = Math.max(0, shift.spots_remaining + (spotsNum - shift.spots));
    const { error } = await supabase
      .from("jobs")
      .update({
        role: form.role,
        type: form.type,
        date: form.type === "single" && form.date ? form.date : null,
        start_time: form.startTime || null,
        end_time: form.endTime || null,
        working_days: form.type === "parttime" ? days : [],
        start_date: form.type === "parttime" && form.startDate ? form.startDate : null,
        end_date: form.type === "parttime" && form.endDate ? form.endDate : null,
        rate: Number(form.rate),
        spots: spotsNum,
        spots_remaining: newRemaining,
        languages,
        atividade: form.atividade,
        note: form.note || null,
      })
      .eq("id", shift.id);
    setBusy(false);
    if (error) {
      toast.error("Could not save changes. Please try again.");
      return;
    }
    toast.success("Shift updated!");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => !busy && onClose()}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 ring-1 ring-ink/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-serif text-xl text-ink">Edit shift</h2>
          <button onClick={() => !busy && onClose()} className="text-ink/40 hover:text-ink"><X size={18} /></button>
        </div>

        <form onSubmit={save} className="mt-5 space-y-5">
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
                <div><Label>Start time</Label><TimeSelect value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} /></div>
                <div><Label>End time</Label><TimeSelect value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} /></div>
              </div>
            </>
          )}

          <div className="grid gap-5 sm:grid-cols-3">
            <div><Label>Pay (€/hr)</Label><input type="number" min={0} className={inputClass} value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} /></div>
            <div><Label>Workers needed</Label><input type="number" min={1} className={inputClass} value={form.spots} onChange={(e) => setForm({ ...form, spots: Number(e.target.value) })} /></div>
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

          <div><Label>Requirements / note (optional)</Label><textarea rows={2} className={inputClass} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={busy} className="rounded-full px-4 py-2 text-sm font-medium text-ink/60 hover:bg-ink/5">Cancel</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-5 py-2 text-sm font-medium text-canvas hover:bg-teal-light disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
