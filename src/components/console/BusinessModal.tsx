import { useEffect, useState } from "react";
import { Trash2, Star, Mail, BadgeCheck } from "lucide-react";
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
  STATUS_LABEL,
  type Business,
  type ConsoleStatus,
} from "@/data/adminStore";
import {
  Field,
  TextInput,
  TextArea,
  SelectInput,
  ToggleRow,
  PrimaryButton,
  GhostButton,
} from "@/components/console/forms";

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as ConsoleStatus[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}));

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
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm(business);
    setErrors({});
  }, [business]);

  if (!form) return null;
  const set = (patch: Partial<Business>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Business name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await store.saveBusiness(form);
      if (form.status !== business?.status) {
        await store.setStatus(form.id, form.status, "business", form.name);
      }
      toast.success("Business updated");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save business");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-sans flex items-center gap-2">
              {form.name || "Business"}
              {form.verified && <BadgeCheck size={16} className="text-pine" />}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1"><Mail size={12} /> {form.email || "—"}</span>
              <span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber text-amber" /> {form.rating.toFixed(1)} ({form.ratingCount})</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Field label="Business name" required error={errors.name}>
              <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} onBlur={validate} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <TextInput value={form.city} onChange={(e) => set({ city: e.target.value })} />
              </Field>
              <Field label="Area / address">
                <TextInput value={form.area} onChange={(e) => set({ area: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category / sector">
                <TextInput value={form.category} onChange={(e) => set({ category: e.target.value })} />
              </Field>
              <Field label="Review status">
                <SelectInput value={form.status} onChange={(v) => set({ status: v as ConsoleStatus })} options={STATUS_OPTIONS} />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Contact name">
                <TextInput value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} />
              </Field>
              <Field label="Contact phone">
                <TextInput value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} />
              </Field>
              <Field label="Contact position">
                <TextInput value={form.contactPosition} onChange={(e) => set({ contactPosition: e.target.value })} />
              </Field>
            </div>

            <Field label="Rating">
              <TextInput type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => set({ rating: Number(e.target.value) })} />
            </Field>

            <ToggleRow
              label="Early-bird business"
              description="Eligible for early-access perks"
              checked={form.isEarlyBird}
              onChange={(v) => set({ isEarlyBird: v })}
            />

            <Field label="Description">
              <TextArea value={form.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2">
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={15} /> Delete
            </button>
            <div className="flex gap-2">
              <GhostButton onClick={onClose}>Cancel</GhostButton>
              <PrimaryButton onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</PrimaryButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Delete {form.name || "this business"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the business account and all associated records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await store.deleteUser(form.id, "business", form.name);
                  toast.success("Business deleted");
                  setConfirmDelete(false);
                  onClose();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not delete business");
                }
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
