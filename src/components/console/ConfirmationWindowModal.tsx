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
import { useAdminStore, type ConfirmationWindow } from "@/data/adminStore";
import { Field, TextInput, ToggleRow, PrimaryButton, GhostButton } from "@/components/console/forms";

export function ConfirmationWindowModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [form, setForm] = useState<ConfirmationWindow>(store.confirmationWindow);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(store.confirmationWindow);
      setError("");
    }
  }, [open, store.confirmationWindow]);

  const set = (patch: Partial<ConfirmationWindow>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (form.endTime <= form.startTime) {
      setError("End time must be after start time");
      return;
    }
    setSaving(true);
    try {
      await store.saveConfirmationWindow(form);
      toast.success("Confirmation window saved");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-sans">Daily confirmation window</DialogTitle>
          <DialogDescription>The daily window during which matches must be mutually confirmed.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time" required error={error}>
              <TextInput type="time" value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} />
            </Field>
            <Field label="End time" required>
              <TextInput type="time" value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} />
            </Field>
          </div>

          <Field label="Timezone">
            <TextInput value="Europe/Lisbon" disabled className="bg-mist text-slate" />
          </Field>

          <ToggleRow
            label="Enable automatic match expiry outside window"
            checked={form.autoExpiry}
            onChange={(v) => set({ autoExpiry: v })}
          />
          <ToggleRow
            label="Send reminder to business 30 mins before window closes"
            checked={form.reminder30min}
            onChange={(v) => set({ reminder30min: v })}
          />
        </div>

        <DialogFooter>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
