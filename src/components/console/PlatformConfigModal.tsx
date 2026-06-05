import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminStore, type PlatformConfig } from "@/data/adminStore";
import { Field, TextInput, TextArea, SelectInput, TagMultiSelect, PrimaryButton, GhostButton } from "@/components/console/forms";

const CURRENCIES = ["EUR", "GBP", "USD"];
const TIMEZONES = ["Europe/Lisbon", "Europe/London", "Europe/Madrid", "UTC"];

export function PlatformConfigModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [form, setForm] = useState<PlatformConfig>(store.config);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(store.config);
      setErrors({});
    }
  }, [open, store.config]);

  const set = (patch: Partial<PlatformConfig>) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.platformName.trim()) e.platformName = "Platform name is required";
    if (!form.currency.trim()) e.currency = "Currency is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await store.saveConfig(form);
      toast.success("Platform configuration saved");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-sans">Platform configuration</DialogTitle>
          <DialogDescription>Summary of the current platform setup. All fields are editable.</DialogDescription>
        </DialogHeader>

        {store.loading ? (
          <div className="grid h-40 place-items-center"><Loader2 className="animate-spin text-pine" /></div>
        ) : (
          <div className="space-y-4 py-2">
            <Field label="Platform name" required error={errors.platformName}>
              <TextInput value={form.platformName} onChange={(e) => set({ platformName: e.target.value })} onBlur={validate} />
            </Field>

            <Field label="Platform description">
              <TextArea value={form.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency" required error={errors.currency}>
                <SelectInput value={form.currency} onChange={(v) => set({ currency: v })} options={CURRENCIES} />
              </Field>
              <Field label="Timezone">
                <SelectInput value={form.timezone} onChange={(v) => set({ timezone: v })} options={TIMEZONES} />
              </Field>
            </div>

            <Field label="Operating cities" hint="Add or remove cities">
              <TagMultiSelect
                selected={form.cities}
                options={[]}
                onChange={(v) => set({ cities: v })}
                onAddOption={() => {}}
                placeholder="Add city…"
              />
            </Field>

            <Field label="Supported sectors" hint="Add or remove sectors">
              <TagMultiSelect
                selected={form.sectors}
                options={[]}
                onChange={(v) => set({ sectors: v })}
                onAddOption={() => {}}
                placeholder="Add sector…"
              />
            </Field>
          </div>
        )}

        <DialogFooter>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
