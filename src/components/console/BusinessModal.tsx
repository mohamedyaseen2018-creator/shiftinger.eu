import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAdminStore,
  autoInitials,
  type Business,
  type VerificationStatus,
} from "@/data/adminStore";
import {
  Field,
  TextInput,
  TextArea,
  SelectInput,
  TagMultiSelect,
  PrimaryButton,
  GhostButton,
} from "@/components/console/forms";

const VERIFY: VerificationStatus[] = ["pending", "verified", "suspended"];

export function BusinessModal({
  business,
  open,
  onClose,
}: {
  business: Business | null;
  open: boolean;
  onClose: () => void;
}) {
  const store = useAdminStore();
  const [form, setForm] = useState<Business | null>(business);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialsTouched, setInitialsTouched] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm(business);
    setErrors({});
    setInitialsTouched(false);
  }, [business]);

  if (!form) return null;
  const set = (patch: Partial<Business>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const isNew = !store.businesses.some((b) => b.id === form.id);

  const onNameChange = (name: string) => {
    set({ name, ...(initialsTouched ? {} : { initials: autoInitials(name) }) });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Business name is required";
    if (!form.contactEmail.trim()) e.contactEmail = "Contact email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = "Enter a valid email";
    if (form.nif && !/^\d{9}$/.test(form.nif)) e.nif = "NIF must be 9 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    store.upsertBusiness({ ...form, initials: form.initials || autoInitials(form.name) });
    toast.success(isNew ? "Business added" : "Business updated");
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-sans">{isNew ? "Add business" : "Edit business"}</DialogTitle>
            <DialogDescription>The legal name is stored securely and never shown publicly — only the display initials are.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Business full name (private)" required error={errors.name}>
                <TextInput value={form.name} onChange={(e) => onNameChange(e.target.value)} onBlur={validate} />
              </Field>
              <Field label="Display initials" hint="Auto-generated — override if needed">
                <TextInput
                  value={form.initials}
                  onChange={(e) => {
                    setInitialsTouched(true);
                    set({ initials: e.target.value });
                  }}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <SelectInput value={form.city} onChange={(v) => set({ city: v })} options={store.activeOptions("cities")} />
              </Field>
              <Field label="Sector">
                <SelectInput value={form.sector} onChange={(v) => set({ sector: v })} options={store.activeOptions("sectors")} />
              </Field>
            </div>

            <Field label="Sub-sector">
              <TextInput value={form.subSector} onChange={(e) => set({ subSector: e.target.value })} placeholder="e.g. Rooftop bar" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact name">
                <TextInput value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} />
              </Field>
              <Field label="Contact phone">
                <TextInput value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact email" required error={errors.contactEmail}>
                <TextInput value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} onBlur={validate} />
              </Field>
              <Field label="NIF (tax number)" error={errors.nif}>
                <TextInput value={form.nif} onChange={(e) => set({ nif: e.target.value })} onBlur={validate} />
              </Field>
            </div>

            <Field label="Verification status">
              <SelectInput value={form.verification} onChange={(v) => set({ verification: v as VerificationStatus })} options={VERIFY} />
            </Field>

            <Field label="Languages required for workers">
              <TagMultiSelect
                selected={form.languagesRequired}
                options={store.activeOptions("languages")}
                onChange={(v) => set({ languagesRequired: v })}
                onAddOption={(name) => store.addOption("languages", name)}
                placeholder="New language…"
              />
            </Field>

            <Field label="Preferred worker roles">
              <TagMultiSelect
                selected={form.preferredRoles}
                options={store.activeOptions("skills")}
                onChange={(v) => set({ preferredRoles: v })}
                onAddOption={(name) => store.addOption("skills", name)}
                placeholder="New role…"
              />
            </Field>

            <Field label="Admin notes" hint="Internal only">
              <TextArea value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            </Field>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2">
            {!isNew ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} /> Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <GhostButton onClick={onClose}>Cancel</GhostButton>
              <PrimaryButton onClick={save}>Save business</PrimaryButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Delete this business?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the business and its records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                store.removeBusiness(form.id);
                toast.success("Business deleted");
                setConfirmDelete(false);
                onClose();
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
