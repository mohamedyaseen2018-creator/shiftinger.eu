import { useEffect, useState } from "react";
import { Trash2, Plus, Loader2, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAdminStore, type Kpi } from "@/data/adminStore";
import { Field, TextInput, SelectInput, PrimaryButton, GhostButton } from "@/components/console/forms";

const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly"];
const CATEGORIES = ["Supply", "Demand", "Liquidity", "Revenue", "Trust & Safety"];

const BLANK = { name: "", formula: "", target: 0, unit: "", frequency: "Monthly", category: "Supply" };

export function KpiSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [rows, setRows] = useState<Kpi[]>(store.kpis);
  const [draft, setDraft] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) setRows(store.kpis);
  }, [open, store.kpis]);

  const setRow = (id: string, patch: Partial<Kpi>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all(rows.map((r) => store.upsertKpi(r)));
      toast.success("KPI settings saved");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save KPIs");
    } finally {
      setSaving(false);
    }
  };

  const addCustom = async () => {
    if (!draft.name.trim()) {
      toast.error("KPI name is required");
      return;
    }
    setAdding(true);
    try {
      await store.upsertKpi(draft);
      toast.success("Custom KPI added");
      setDraft({ ...BLANK });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add KPI");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (k: Kpi) => {
    try {
      await store.deleteKpi(k.id);
      toast.success("KPI removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove KPI");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-sans">KPI dashboard settings</DialogTitle>
          <DialogDescription>Configure KPI targets, tracking frequency, and visibility.</DialogDescription>
        </DialogHeader>

        {store.loading ? (
          <div className="grid h-40 place-items-center"><Loader2 className="animate-spin text-pine" /></div>
        ) : (
          <div className="space-y-2 py-2">
            {rows.map((k) => (
              <div key={k.id} className="grid grid-cols-12 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
                <div className="col-span-12 sm:col-span-4">
                  <p className="text-sm font-medium text-ink">{k.name}</p>
                  <p className="text-[11px] text-slate">{k.category}{k.isCustom ? " · custom" : ""}</p>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <TextInput
                    type="number"
                    value={k.target}
                    onChange={(e) => setRow(k.id, { target: Number(e.target.value) })}
                    className="py-1.5"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 text-xs text-slate">{k.unit || "—"}</div>
                <div className="col-span-6 sm:col-span-3">
                  <SelectInput value={k.frequency} onChange={(v) => setRow(k.id, { frequency: v })} options={FREQUENCIES} className="py-1.5" />
                </div>
                <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRow(k.id, { enabled: !k.enabled })}
                    title={k.enabled ? "Visible — click to hide" : "Hidden — click to show"}
                    className="text-slate hover:text-pine-dark"
                  >
                    {k.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <Switch checked={k.enabled} onCheckedChange={(v) => setRow(k.id, { enabled: v })} />
                  {k.isCustom && (
                    <button type="button" onClick={() => remove(k)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="mt-4 rounded-xl border border-dashed border-line bg-mist/40 p-3">
              <p className="mb-2 text-sm font-semibold text-ink">Add custom KPI</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Field label="Name" required>
                  <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </Field>
                <Field label="Unit">
                  <TextInput value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} placeholder="%, €, hrs…" />
                </Field>
                <Field label="Target">
                  <TextInput type="number" value={draft.target} onChange={(e) => setDraft({ ...draft, target: Number(e.target.value) })} />
                </Field>
                <Field label="Frequency">
                  <SelectInput value={draft.frequency} onChange={(v) => setDraft({ ...draft, frequency: v })} options={FREQUENCIES} />
                </Field>
                <Field label="Category">
                  <SelectInput value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} options={CATEGORIES} />
                </Field>
                <Field label="Formula description">
                  <TextInput value={draft.formula} onChange={(e) => setDraft({ ...draft, formula: e.target.value })} />
                </Field>
              </div>
              <div className="mt-2 flex justify-end">
                <GhostButton onClick={addCustom} disabled={adding}>
                  <Plus size={14} /> {adding ? "Adding…" : "Add KPI"}
                </GhostButton>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={saveAll} disabled={saving}>{saving ? "Saving…" : "Save KPI settings"}</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
