import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2, Star, Mail, BadgeCheck, Ban, Building2 } from "lucide-react";
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
  ManagedSelect,
  TagMultiSelect,
  ToggleRow,
  PrimaryButton,
  GhostButton,
} from "@/components/console/forms";
import type { ListKey } from "@/data/adminStore";

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
  const [confirmBan, setConfirmBan] = useState(false);
  const [banReason, setBanReason] = useState("");


  useEffect(() => {
    setForm(business);
    setErrors({});
  }, [business]);

  const addOption = (listKey: ListKey) => (value: string) =>
    store.upsertListOption({ listKey, value }).catch(() => {});

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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Business full name" required error={errors.name} hint="Stored securely, never shown publicly">
                <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} onBlur={validate} />
              </Field>
              <Field label="Display initials" hint="Shown publicly until verified">
                <TextInput value={form.displayInitials} onChange={(e) => set({ displayInitials: e.target.value })} placeholder="e.g. R.P.***" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <ManagedSelect
                  value={form.city}
                  onChange={(v) => set({ city: v })}
                  options={store.listFor("city")}
                  onAddOption={addOption("city")}
                  placeholder="New city…"
                  allowEmpty
                />
              </Field>
              <Field label="Area / address">
                <TextInput value={form.area} onChange={(e) => set({ area: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Sector">
                <ManagedSelect
                  value={form.category}
                  onChange={(v) => set({ category: v })}
                  options={store.listFor("sector")}
                  onAddOption={addOption("sector")}
                  placeholder="New sector…"
                  allowEmpty
                />
              </Field>
              <Field label="Sub-sector">
                <ManagedSelect
                  value={form.subSector}
                  onChange={(v) => set({ subSector: v })}
                  options={store.listFor("sub_sector")}
                  onAddOption={addOption("sub_sector")}
                  placeholder="New sub-sector…"
                  allowEmpty
                />
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
              <TagMultiSelect
                selected={form.languagesRequired}
                options={store.listFor("language")}
                onChange={(v) => set({ languagesRequired: v })}
                onAddOption={addOption("language")}
                placeholder="New language…"
              />
            </Field>

            <Field label="Preferred worker roles">
              <TagMultiSelect
                selected={form.preferredRoles}
                options={store.listFor("skill")}
                onChange={(v) => set({ preferredRoles: v })}
                onAddOption={addOption("skill")}
                placeholder="New role…"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Verification status">
                <SelectInput value={form.status} onChange={(v) => set({ status: v as ConsoleStatus })} options={STATUS_OPTIONS} />
              </Field>
              <Field label="Rating">
                <TextInput type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => set({ rating: Number(e.target.value) })} />
              </Field>
            </div>

            <ToggleRow
              label="Early-bird business"
              description="Eligible for early-access perks"
              checked={form.isEarlyBird}
              onChange={(v) => set({ isEarlyBird: v })}
            />

            <Field label="Description">
              <TextArea value={form.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>

            <Field label="Admin notes" hint="Internal — never shown publicly">
              <TextArea value={form.adminNotes} onChange={(e) => set({ adminNotes: e.target.value })} />
            </Field>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} /> Delete
              </button>
              <button
                onClick={() => setConfirmBan(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Ban size={15} /> Ban
              </button>
            </div>

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

      <AlertDialog open={confirmBan} onOpenChange={setConfirmBan}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Ban {form.name || "this business"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the account and permanently blacklists their email and phone number. They
              will never be able to register again with the same email or phone. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1">
            <Field label="Reason (optional, internal)">
              <TextInput
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. fraud, abuse"
              />
            </Field>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await store.banUser(form.id, "business", form.name, banReason || undefined);
                  toast.success("Business banned");
                  setConfirmBan(false);
                  onClose();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not ban business");
                }
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Ban permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

}
