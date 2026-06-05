import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
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
  const [form, setForm] = useState<ConfirmationWindow>(store.window);

  useEffect(() => {
    if (open) setForm(store.window);
  }, [open, store.window]);

  const set = (patch: Partial<ConfirmationWindow>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">Confirmation window</DialogTitle>
          <DialogDescription>The daily window during which matched shifts must be mutually confirmed.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time" required>
              <TextInput type="time" value={form.start} onChange={(e) => set({ start: e.target.value })} />
            </Field>
            <Field label="End time" required>
              <TextInput type="time" value={form.end} onChange={(e) => set({ end: e.target.value })} />
            </Field>
          </div>
          <Field label="Timezone">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-mist px-3 py-2 text-sm text-slate">
              <Lock size={14} /> {form.timezone}
            </div>
          </Field>
          <ToggleRow
            label="Auto-expire matches outside window"
            description="Unconfirmed matches expire automatically when the window closes"
            checked={form.autoExpiry}
            onChange={(v) => set({ autoExpiry: v })}
          />
          <ToggleRow
            label="Reminder 30 mins before close"
            description="Notify the business 30 minutes before the window closes"
            checked={form.reminder}
            onChange={(v) => set({ reminder: v })}
          />
        </div>

        <DialogFooter>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton
            onClick={() => {
              if (form.start >= form.end) return toast.error("End time must be after start time");
              store.setWindow(form);
              toast.success("Confirmation window saved");
              onClose();
            }}
          >
            Save changes
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
