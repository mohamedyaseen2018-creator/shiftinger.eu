import { useEffect, useState } from "react";
import { Trash2, Star, Mail, Phone, ExternalLink, Ban } from "lucide-react";
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
  STATUS_LABEL,
  type Worker,
  type ConsoleStatus,
} from "@/data/adminStore";
import {
  Field,
  TextInput,
  TextArea,
  SelectInput,
  ManagedSelect,
  ToggleRow,
  TagMultiSelect,
  PrimaryButton,
  GhostButton,
} from "@/components/console/forms";
import type { ListKey } from "@/data/adminStore";

const STATUS_OPTIONS = (Object.keys(STATUS_LABEL) as ConsoleStatus[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}));

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
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBan, setConfirmBan] = useState(false);
  const [banReason, setBanReason] = useState("");


  useEffect(() => {
    setForm(worker);
    setErrors({});
  }, [worker]);

  const nationalityOptions = store.listFor("nationality");
  const cityOptions = store.listFor("city");
  const languageOptions = store.listFor("language");
  const roleOptions = store.listFor("skill");
  const addOption = (listKey: ListKey) => (value: string) =>
    store.upsertListOption({ listKey, value }).catch(() => {});

  if (!form) return null;
  const set = (patch: Partial<Worker>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await store.saveWorker(form);
      if (form.status !== worker?.status) {
        await store.setStatus(form.id, form.status, "worker", form.name);
      }
      toast.success("Worker updated");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save worker");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto bg-canvas p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-line bg-white px-6 py-4">
            <SheetTitle className="font-sans">Edit worker</SheetTitle>
            <SheetDescription>Edit profile details and review status. Changes are saved to the database.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="rounded-xl border border-line bg-white px-4 py-3 text-xs text-slate">
              <p className="flex items-center gap-2"><Mail size={13} /> {form.email || "—"}</p>
              <p className="mt-1 flex items-center gap-2"><Phone size={13} /> {form.phone || "—"}</p>
              <p className="mt-1 flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><Star size={13} className="fill-amber text-amber" /> {form.rating.toFixed(1)} ({form.ratingCount})</span>
                <span>· {form.shiftsCompleted} shifts</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name" required error={errors.name}>
                <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} onBlur={validate} />
              </Field>
              <Field label="Phone">
                <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nationality">
                <ManagedSelect
                  value={form.nationality}
                  onChange={(v) => set({ nationality: v })}
                  options={nationalityOptions}
                  onAddOption={addOption("nationality")}
                  placeholder="New nationality…"
                  allowEmpty
                />
              </Field>
              <Field label="City">
                <ManagedSelect
                  value={form.city}
                  onChange={(v) => set({ city: v })}
                  options={cityOptions}
                  onAddOption={addOption("city")}
                  placeholder="New city…"
                  allowEmpty
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Main role">
                <ManagedSelect
                  value={form.mainRole}
                  onChange={(v) => set({ mainRole: v })}
                  options={roleOptions}
                  onAddOption={addOption("skill")}
                  placeholder="New role…"
                  allowEmpty
                />
              </Field>
              <Field label="Years in main role">
                <TextInput
                  type="number"
                  min={0}
                  value={form.mainRoleYears}
                  onChange={(e) => set({ mainRoleYears: Number(e.target.value) })}
                />
              </Field>
            </div>

            <Field label="Skills / secondary roles">
              <TagMultiSelect
                selected={form.subRoles}
                options={roleOptions}
                onChange={(v) => set({ subRoles: v })}
                onAddOption={addOption("skill")}
                placeholder="New role…"
              />
            </Field>

            <Field label="Languages spoken">
              <TagMultiSelect
                selected={form.languages}
                options={languageOptions}
                onChange={(v) => set({ languages: v })}
                onAddOption={addOption("language")}
                placeholder="New language…"
              />
            </Field>

            <ToggleRow
              label="Atividade (self-employed status)"
              description="Registered as independent worker with Finanças"
              checked={form.atividade}
              onChange={(v) => set({ atividade: v })}
            />
            {form.atividade && (
              <Field label="Atividade registration number">
                <TextInput value={form.atividadeNumber} onChange={(e) => set({ atividadeNumber: e.target.value })} placeholder="e.g. 123456789" />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Review status">
                <SelectInput value={form.status} onChange={(v) => set({ status: v as ConsoleStatus })} options={STATUS_OPTIONS} />
              </Field>
              <Field label="Min rate (€/h)">
                <TextInput type="number" min={0} step={0.5} value={form.minRate} onChange={(e) => set({ minRate: Number(e.target.value) })} />
              </Field>
            </div>

            <Field label="Rating">
              <TextInput type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(e) => set({ rating: Number(e.target.value) })} />
            </Field>

            <Field label="Portfolio / CV link" hint={form.portfolioUrl ? undefined : "Optional"}>
              <TextInput value={form.portfolioUrl} onChange={(e) => set({ portfolioUrl: e.target.value })} placeholder="https://…" />
            </Field>
            {form.portfolioUrl && (
              <a href={form.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-pine-dark hover:underline">
                <ExternalLink size={12} /> Open link
              </a>
            )}

            <Field label="Bio">
              <TextArea value={form.bio} onChange={(e) => set({ bio: e.target.value })} />
            </Field>

            <Field label="Admin notes" hint="Internal — never shown to the worker">
              <TextArea value={form.adminNotes} onChange={(e) => set({ adminNotes: e.target.value })} />
            </Field>
          </div>

          <SheetFooter className="mt-auto flex-row items-center justify-between gap-2 border-t border-line bg-white px-6 py-4">
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
          </SheetFooter>

        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Delete {form.name || "this worker"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the worker account and all associated records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await store.deleteUser(form.id, "worker", form.name);
                  toast.success("Worker deleted");
                  setConfirmDelete(false);
                  onClose();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not delete worker");
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
            <AlertDialogTitle className="font-sans">Ban {form.name || "this worker"}?</AlertDialogTitle>
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
                placeholder="e.g. repeated no-shows, fraud"
              />
            </Field>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await store.banUser(form.id, "worker", form.name, banReason || undefined);
                  toast.success("Worker banned");
                  setConfirmBan(false);
                  onClose();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not ban worker");
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
