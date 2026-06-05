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
import { useAdminStore, type ListKey, type NewBusinessInput } from "@/data/adminStore";
import {
  Field,
  TextInput,
  TextArea,
  ManagedSelect,
  TagMultiSelect,
  PrimaryButton,
  GhostButton,
} from "@/components/console/forms";

function initialsFrom(name: string): string {
  const i = name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join(".");
  return i ? `${i}.***` : "";
}

const BLANK: NewBusinessInput = {
  name: "",
  email: "",
  displayInitials: "",
  city: "",
  category: "",
  subSector: "",
  contactName: "",
  contactPhone: "",
  nif: "",
  languagesRequired: [],
  preferredRoles: [],
  adminNotes: "",
};

export function AddBusinessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [form, setForm] = useState<NewBusinessInput>({ ...BLANK });
  const [initialsTouched, setInitialsTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...BLANK });
      setInitialsTouched(false);
      setErrors({});
    }
  }, [open]);

  const set = (patch: Partial<NewBusinessInput>) => setForm((f) => ({ ...f, ...patch }));
  const addOption = (listKey: ListKey) => (value: string) =>
    store.upsertListOption({ listKey, value }).catch(() => {});

  const onName = (name: string) =>
    set({ name, displayInitials: initialsTouched ? form.displayInitials : initialsFrom(name) });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Business name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "A valid email is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await store.createBusiness(form);
      toast.success("Business created");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create business");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-sans">Add business</DialogTitle>
          <DialogDescription>Create a business account manually. An account is created with the contact email below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Business full name" required error={errors.name} hint="Stored securely, never shown publicly">
              <TextInput value={form.name} onChange={(e) => onName(e.target.value)} onBlur={validate} />
            </Field>
            <Field label="Display initials" hint="Auto-generated — editable">
              <TextInput
                value={form.displayInitials}
                onChange={(e) => {
                  setInitialsTouched(true);
                  set({ displayInitials: e.target.value });
                }}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <ManagedSelect value={form.city ?? ""} onChange={(v) => set({ city: v })} options={store.listFor("city")} onAddOption={addOption("city")} allowEmpty placeholder="New city…" />
            </Field>
            <Field label="Contact email" required error={errors.email}>
              <TextInput type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} onBlur={validate} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Sector">
              <ManagedSelect value={form.category ?? ""} onChange={(v) => set({ category: v })} options={store.listFor("sector")} onAddOption={addOption("sector")} allowEmpty placeholder="New sector…" />
            </Field>
            <Field label="Sub-sector">
              <ManagedSelect value={form.subSector ?? ""} onChange={(v) => set({ subSector: v })} options={store.listFor("sub_sector")} onAddOption={addOption("sub_sector")} allowEmpty placeholder="New sub-sector…" />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Contact name">
              <TextInput value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} />
            </Field>
            <Field label="Contact phone">
              <TextInput value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} />
            </Field>
            <Field label="NIF (tax number)">
              <TextInput value={form.nif} onChange={(e) => set({ nif: e.target.value })} />
            </Field>
          </div>

          <Field label="Languages required for workers">
            <TagMultiSelect selected={form.languagesRequired ?? []} options={store.listFor("language")} onChange={(v) => set({ languagesRequired: v })} onAddOption={addOption("language")} placeholder="New language…" />
          </Field>

          <Field label="Preferred worker roles">
            <TagMultiSelect selected={form.preferredRoles ?? []} options={store.listFor("skill")} onChange={(v) => set({ preferredRoles: v })} onAddOption={addOption("skill")} placeholder="New role…" />
          </Field>

          <Field label="Admin notes" hint="Internal — never shown publicly">
            <TextArea value={form.adminNotes} onChange={(e) => set({ adminNotes: e.target.value })} />
          </Field>
        </div>

        <DialogFooter>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={saving}>{saving ? "Creating…" : "Save business"}</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
