import { useEffect, useState } from "react";
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
import {
  Field,
  TextInput,
  TextArea,
  SelectInput,
  TagMultiSelect,
  PrimaryButton,
  GhostButton,
} from "@/components/console/forms";

const CURRENCIES = ["EUR (€)", "GBP (£)", "USD ($)"];
const TIMEZONES = ["Europe/Lisbon", "Europe/Madrid", "Europe/London", "UTC"];

export function PlatformConfigModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [form, setForm] = useState<PlatformConfig>(store.platform);

  useEffect(() => {
    if (open) setForm(store.platform);
  }, [open, store.platform]);

  const set = (patch: Partial<PlatformConfig>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-sans">Platform configuration</DialogTitle>
          <DialogDescription>Summary of the current platform setup. All values are editable.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Platform name" required>
            <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Platform description">
            <TextArea value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
          <Field label="Operating cities" hint="Toggle, or type to add a new city">
            <TagMultiSelect
              selected={form.cities}
              options={store.activeOptions("cities")}
              onChange={(v) => set({ cities: v })}
              onAddOption={(name) => store.addOption("cities", name)}
              placeholder="New city…"
            />
          </Field>
          <Field label="Supported sectors" hint="Toggle, or type to add a new sector">
            <TagMultiSelect
              selected={form.sectors}
              options={store.activeOptions("sectors")}
              onChange={(v) => set({ sectors: v })}
              onAddOption={(name) => store.addOption("sectors", name)}
              placeholder="New sector…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform currency">
              <SelectInput value={form.currency} onChange={(v) => set({ currency: v })} options={CURRENCIES} />
            </Field>
            <Field label="Platform timezone">
              <SelectInput value={form.timezone} onChange={(v) => set({ timezone: v })} options={TIMEZONES} />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton
            onClick={() => {
              if (!form.name.trim()) return toast.error("Platform name is required");
              store.setPlatform(form);
              toast.success("Configuration saved");
              onClose();
            }}
          >
            Save changes
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
