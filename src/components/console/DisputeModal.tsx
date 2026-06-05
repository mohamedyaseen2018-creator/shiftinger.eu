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
  Field,
  TextInput,
  TextArea,
  SelectInput,
  ManagedSelect,
  PrimaryButton,
  GhostButton,
} from "@/components/console/forms";
import { useAdminStore, DISPUTE_STATUS_LABEL, type Dispute } from "@/data/adminStore";

const STATUS_OPTIONS = Object.entries(DISPUTE_STATUS_LABEL).map(([value, label]) => ({ value, label }));
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const BLANK: Dispute = {
  id: "",
  title: "",
  workerLabel: "",
  businessLabel: "",
  issueType: "",
  status: "open",
  priority: "medium",
  assignedAdminId: null,
  assignedAdminLabel: "",
  deadline: null,
  internalNotes: "",
  resolutionSummary: "",
  createdAt: "",
};

export function DisputeModal({
  dispute,
  open,
  onClose,
}: {
  dispute: Dispute | null;
  open: boolean;
  onClose: () => void;
}) {
  const store = useAdminStore();
  const [form, setForm] = useState<Dispute>(dispute ?? BLANK);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(dispute ?? { ...BLANK });
      setErrors({});
    }
  }, [open, dispute]);

  const isNew = !form.id;
  const set = (patch: Partial<Dispute>) => setForm((f) => ({ ...f, ...patch }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await store.upsertDispute({ ...form, id: form.id || undefined });
      toast.success(isNew ? "Dispute created" : "Dispute updated");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save dispute");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-sans">{isNew ? "New dispute" : "Edit dispute"}</DialogTitle>
            <DialogDescription>Track and resolve disputes between workers and businesses.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Field label="Title" required error={errors.title}>
              <TextInput value={form.title} onChange={(e) => set({ title: e.target.value })} onBlur={validate} placeholder="Short summary of the issue" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Worker">
                <TextInput value={form.workerLabel} onChange={(e) => set({ workerLabel: e.target.value })} placeholder="e.g. Maria S." />
              </Field>
              <Field label="Business">
                <TextInput value={form.businessLabel} onChange={(e) => set({ businessLabel: e.target.value })} placeholder="e.g. R.P.***" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Issue type">
                <ManagedSelect
                  value={form.issueType}
                  onChange={(v) => set({ issueType: v })}
                  options={store.listFor("dispute_issue_type")}
                  onAddOption={(v) => store.upsertListOption({ listKey: "dispute_issue_type", value: v }).catch(() => {})}
                  allowEmpty
                  placeholder="New issue type…"
                />
              </Field>
              <Field label="Priority">
                <SelectInput value={form.priority} onChange={(v) => set({ priority: v })} options={PRIORITY_OPTIONS} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <SelectInput value={form.status} onChange={(v) => set({ status: v })} options={STATUS_OPTIONS} />
              </Field>
              <Field label="Resolution deadline">
                <TextInput type="date" value={form.deadline ?? ""} onChange={(e) => set({ deadline: e.target.value || null })} />
              </Field>
            </div>

            <Field label="Assigned admin">
              <select
                value={form.assignedAdminId ?? ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  const admin = store.admins.find((a) => a.id === id);
                  set({ assignedAdminId: id, assignedAdminLabel: admin ? admin.name : "" });
                }}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine"
              >
                <option value="">Unassigned</option>
                {store.admins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Internal admin notes">
              <TextArea value={form.internalNotes} onChange={(e) => set({ internalNotes: e.target.value })} />
            </Field>

            <Field label="Resolution summary" hint="Fill in when resolving">
              <TextArea value={form.resolutionSummary} onChange={(e) => set({ resolutionSummary: e.target.value })} />
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
              <PrimaryButton onClick={save} disabled={saving}>{saving ? "Saving…" : isNew ? "Create dispute" : "Save changes"}</PrimaryButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Delete this dispute?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the dispute record. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await store.deleteDispute(form.id);
                  toast.success("Dispute deleted");
                  setConfirmDelete(false);
                  onClose();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not delete");
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
