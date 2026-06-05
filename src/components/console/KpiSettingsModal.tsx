import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  useAdminStore,
  type KpiConfig,
  type KpiFrequency,
  type KpiCategory,
} from "@/data/adminStore";
import { Field, TextInput, SelectInput, PrimaryButton, GhostButton } from "@/components/console/forms";

const FREQS: KpiFrequency[] = ["Daily", "Weekly", "Monthly", "Quarterly"];
const CATS: KpiCategory[] = ["Supply", "Demand", "Liquidity", "Revenue", "Trust & Safety"];

export function KpiSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Omit<KpiConfig, "id">>({
    name: "",
    formula: "",
    target: 0,
    unit: "count",
    frequency: "Monthly",
    category: "Supply",
    enabled: true,
    custom: true,
  });

  const addKpi = () => {
    if (!draft.name.trim()) return toast.error("KPI name is required");
    store.upsertKpi({ ...draft, id: store.newId() });
    toast.success("Custom KPI added");
    setDraft({ name: "", formula: "", target: 0, unit: "count", frequency: "Monthly", category: "Supply", enabled: true, custom: true });
    setAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-sans">KPI settings</DialogTitle>
          <DialogDescription>Configure targets, tracking frequency, and visibility for every KPI.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {store.kpis.map((k) => (
            <div key={k.id} className="rounded-xl border border-line bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{k.name}</p>
                  <p className="text-[11px] text-slate">{k.category}{k.custom && " · custom"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate">{k.enabled ? "Shown" : "Hidden"}</span>
                  <Switch checked={k.enabled} onCheckedChange={(v) => store.upsertKpi({ ...k, enabled: v })} />
                  {k.custom && (
                    <button onClick={() => { store.removeKpi(k.id); toast.success("KPI removed"); }} className="text-slate hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Field label={`Target (${k.unit})`}>
                  <TextInput type="number" value={k.target} onChange={(e) => store.upsertKpi({ ...k, target: Number(e.target.value) })} />
                </Field>
                <Field label="Unit">
                  <TextInput value={k.unit} readOnly className="bg-mist text-slate" />
                </Field>
                <Field label="Frequency">
                  <SelectInput value={k.frequency} onChange={(v) => store.upsertKpi({ ...k, frequency: v as KpiFrequency })} options={FREQS} />
                </Field>
              </div>
            </div>
          ))}
        </div>

        {adding ? (
          <div className="rounded-xl border border-pine/40 bg-pine-soft/30 p-3">
            <p className="mb-2 text-sm font-semibold text-ink">New custom KPI</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="KPI name" required>
                <TextInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </Field>
              <Field label="Formula description">
                <TextInput value={draft.formula} onChange={(e) => setDraft({ ...draft, formula: e.target.value })} />
              </Field>
              <Field label="Target value">
                <TextInput type="number" value={draft.target} onChange={(e) => setDraft({ ...draft, target: Number(e.target.value) })} />
              </Field>
              <Field label="Unit">
                <TextInput value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
              </Field>
              <Field label="Frequency">
                <SelectInput value={draft.frequency} onChange={(v) => setDraft({ ...draft, frequency: v as KpiFrequency })} options={FREQS} />
              </Field>
              <Field label="Category">
                <SelectInput value={draft.category} onChange={(v) => setDraft({ ...draft, category: v as KpiCategory })} options={CATS} />
              </Field>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <GhostButton onClick={() => setAdding(false)}>Cancel</GhostButton>
              <PrimaryButton onClick={addKpi}>Add KPI</PrimaryButton>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-line px-3 py-2 text-sm font-medium text-slate hover:border-pine hover:text-pine-dark"
          >
            <Plus size={15} /> Add custom KPI
          </button>
        )}

        <DialogFooter>
          <PrimaryButton onClick={() => { toast.success("KPI settings saved"); onClose(); }}>Save KPI settings</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
