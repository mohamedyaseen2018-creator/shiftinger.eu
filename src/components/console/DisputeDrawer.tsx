import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  type Dispute,
  type DisputeWorkflowStatus,
} from "@/data/adminStore";
import {
  Field,
  TextInput,
  TextArea,
  SelectInput,
  PrimaryButton,
  GhostButton,
} from "@/components/console/forms";

const STATUSES: { value: DisputeWorkflowStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "under_review", label: "Under review" },
  { value: "resolved", label: "Resolved" },
  { value: "escalated", label: "Escalated" },
  { value: "closed", label: "Closed" },
];

export function DisputeDrawer({
  dispute,
  open,
  onClose,
}: {
  dispute: Dispute | null;
  open: boolean;
  onClose: () => void;
}) {
  const store = useAdminStore();
  const [form, setForm] = useState<Dispute | null>(dispute);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => setForm(dispute), [dispute]);
  if (!form) return null;
  const set = (patch: Partial<Dispute>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const isNew = !store.disputes.some((d) => d.id === form.id);

  const save = () => {
    store.upsertDispute(form);
    toast.success(isNew ? "Dispute created" : "Dispute updated");
    onClose();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto bg-canvas p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-line bg-white px-6 py-4">
            <SheetTitle className="font-sans">{isNew ? "New dispute" : `Dispute ${form.id}`}</SheetTitle>
            <SheetDescription>
              {form.workerName} · {store.businessLabel(form.businessId)}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 py-5">
            {isNew && (
              <Field label="Worker name">
                <TextInput value={form.workerName} onChange={(e) => set({ workerName: e.target.value })} />
              </Field>
            )}
            <Field label="Issue type">
              <SelectInput value={form.issueType} onChange={(v) => set({ issueType: v })} options={store.activeOptions("disputeIssueTypes")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <SelectInput value={form.status} onChange={(v) => set({ status: v as DisputeWorkflowStatus })} options={STATUSES} />
              </Field>
              <Field label="Resolution deadline">
                <TextInput type="date" value={form.deadline} onChange={(e) => set({ deadline: e.target.value })} />
              </Field>
            </div>
            <Field label="Assign to admin">
              <SelectInput
                value={form.assignedTo}
                onChange={(v) => set({ assignedTo: v })}
                options={[{ value: "", label: "Unassigned" }, ...store.adminUsers.map((u) => ({ value: u.name, label: u.name }))]}
              />
            </Field>
            <Field label="Internal admin notes" hint="Visible to admins only">
              <TextArea value={form.internalNotes} onChange={(e) => set({ internalNotes: e.target.value })} />
            </Field>
            <Field label="Resolution summary" hint="Required when marking as resolved">
              <TextArea value={form.resolutionSummary} onChange={(e) => set({ resolutionSummary: e.target.value })} />
            </Field>
          </div>

          <SheetFooter className="mt-auto flex-row items-center justify-between gap-2 border-t border-line bg-white px-6 py-4">
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
              <PrimaryButton
                onClick={() => {
                  if (form.status === "resolved" && !form.resolutionSummary.trim()) {
                    toast.error("Add a resolution summary before resolving");
                    return;
                  }
                  save();
                }}
              >
                Save dispute
              </PrimaryButton>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Delete dispute {form.id}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the dispute record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                store.removeDispute(form.id);
                toast.success("Dispute deleted");
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
