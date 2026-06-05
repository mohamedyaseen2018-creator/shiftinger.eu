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
import { useAdminStore, type Worker, type AccountStatus } from "@/data/adminStore";
import {
  Field,
  TextInput,
  TextArea,
  SelectInput,
  ToggleRow,
  TagMultiSelect,
  PrimaryButton,
  GhostButton,
} from "@/components/console/forms";

const STATUSES: AccountStatus[] = ["active", "inactive", "suspended"];

export function WorkerDrawer({
  worker,
  open,
  onClose,
}: {
  worker: Worker | null;
  open: boolean;
  onClose: () => void;
}) {
  const store = useAdminStore();
  const [form, setForm] = useState<Worker | null>(worker);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setForm(worker);
    setErrors({});
  }, [worker]);

  if (!form) return null;
  const set = (patch: Partial<Worker>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const isNew = !store.workers.some((w) => w.id === form.id);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.atividade && !form.atividadeNumber.trim()) e.atividadeNumber = "Registration number required when Atividade is on";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    store.upsertWorker(form);
    toast.success(isNew ? "Worker created" : "Worker updated");
    onClose();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto bg-canvas p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-line bg-white px-6 py-4">
            <SheetTitle className="font-sans">{isNew ? "Add worker" : "Edit worker"}</SheetTitle>
            <SheetDescription>All fields are editable. Changes apply immediately.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name" required error={errors.name}>
                <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} onBlur={validate} />
              </Field>
              <Field label="Phone">
                <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
              </Field>
            </div>
            <Field label="Email" required error={errors.email}>
              <TextInput value={form.email} onChange={(e) => set({ email: e.target.value })} onBlur={validate} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nationality">
                <SelectInput value={form.nationality} onChange={(v) => set({ nationality: v })} options={store.activeOptions("nationalities")} />
              </Field>
              <Field label="City">
                <SelectInput value={form.city} onChange={(v) => set({ city: v })} options={store.activeOptions("cities")} />
              </Field>
            </div>

            <Field label="Languages spoken" hint="Click to toggle, or type to add a new language">
              <TagMultiSelect
                selected={form.languages}
                options={store.activeOptions("languages")}
                onChange={(v) => set({ languages: v })}
                onAddOption={(name) => store.addOption("languages", name)}
                placeholder="New language…"
              />
            </Field>

            <Field label="Skills / roles" hint="Click to toggle, or type to add a new skill">
              <TagMultiSelect
                selected={form.skills}
                options={store.activeOptions("skills")}
                onChange={(v) => set({ skills: v })}
                onAddOption={(name) => store.addOption("skills", name)}
                placeholder="New skill…"
              />
            </Field>

            <ToggleRow
              label="Atividade (self-employed status)"
              description="Registered as independent worker with Finanças"
              checked={form.atividade}
              onChange={(v) => set({ atividade: v })}
            />
            {form.atividade && (
              <Field label="Atividade registration number" required error={errors.atividadeNumber}>
                <TextInput value={form.atividadeNumber} onChange={(e) => set({ atividadeNumber: e.target.value })} onBlur={validate} />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Account status">
                <SelectInput value={form.status} onChange={(v) => set({ status: v as AccountStatus })} options={STATUSES} />
              </Field>
              <Field label="Rating">
                <TextInput type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => set({ rating: Number(e.target.value) })} />
              </Field>
            </div>

            <Field label="Admin notes" hint="Internal only — never shown to the worker">
              <TextArea value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
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
              <PrimaryButton onClick={save}>{isNew ? "Create worker" : "Save changes"}</PrimaryButton>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Delete {form.name || "this worker"}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the worker and all associated records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                store.removeWorker(form.id);
                toast.success("Worker deleted");
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
