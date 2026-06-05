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
import { useAdminStore, type ListKey, type NewWorkerInput } from "@/data/adminStore";
import {
  Field,
  TextInput,
  TextArea,
  ManagedSelect,
  TagMultiSelect,
  ToggleRow,
  PrimaryButton,
  GhostButton,
} from "@/components/console/forms";

const BLANK: NewWorkerInput = {
  name: "",
  email: "",
  phone: "",
  nationality: "",
  city: "",
  mainRole: "",
  subRoles: [],
  languages: [],
  atividade: false,
  atividadeNumber: "",
  adminNotes: "",
};

export function AddWorkerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [form, setForm] = useState<NewWorkerInput>({ ...BLANK });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...BLANK });
      setErrors({});
    }
  }, [open]);

  const set = (patch: Partial<NewWorkerInput>) => setForm((f) => ({ ...f, ...patch }));
  const addOption = (listKey: ListKey) => (value: string) =>
    store.upsertListOption({ listKey, value }).catch(() => {});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "A valid email is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await store.createWorker(form);
      toast.success("Worker created");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create worker");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-sans">Add worker</DialogTitle>
          <DialogDescription>Create a worker account manually. An account is created with the email below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name" required error={errors.name}>
              <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} onBlur={validate} />
            </Field>
            <Field label="Email" required error={errors.email}>
              <TextInput type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} onBlur={validate} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label="Nationality">
              <ManagedSelect value={form.nationality ?? ""} onChange={(v) => set({ nationality: v })} options={store.listFor("nationality")} onAddOption={addOption("nationality")} allowEmpty placeholder="New nationality…" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <ManagedSelect value={form.city ?? ""} onChange={(v) => set({ city: v })} options={store.listFor("city")} onAddOption={addOption("city")} allowEmpty placeholder="New city…" />
            </Field>
            <Field label="Main role">
              <ManagedSelect value={form.mainRole ?? ""} onChange={(v) => set({ mainRole: v })} options={store.listFor("skill")} onAddOption={addOption("skill")} allowEmpty placeholder="New role…" />
            </Field>
          </div>

          <Field label="Skills / roles">
            <TagMultiSelect selected={form.subRoles ?? []} options={store.listFor("skill")} onChange={(v) => set({ subRoles: v })} onAddOption={addOption("skill")} placeholder="New role…" />
          </Field>

          <Field label="Languages spoken">
            <TagMultiSelect selected={form.languages ?? []} options={store.listFor("language")} onChange={(v) => set({ languages: v })} onAddOption={addOption("language")} placeholder="New language…" />
          </Field>

          <ToggleRow label="Atividade (self-employed status)" checked={!!form.atividade} onChange={(v) => set({ atividade: v })} />
          {form.atividade && (
            <Field label="Atividade registration number">
              <TextInput value={form.atividadeNumber} onChange={(e) => set({ atividadeNumber: e.target.value })} />
            </Field>
          )}

          <Field label="Admin notes" hint="Internal — never shown to the worker">
            <TextArea value={form.adminNotes} onChange={(e) => set({ adminNotes: e.target.value })} />
          </Field>
        </div>

        <DialogFooter>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={saving}>{saving ? "Creating…" : "Create worker"}</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
