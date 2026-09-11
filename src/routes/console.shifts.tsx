import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill, statusTone } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, TextInput, TextArea, SelectInput, TagMultiSelect, PrimaryButton, GhostButton } from "@/components/console/forms";
import { useAdminStore, maskBusiness, type Shift, type JobStatus } from "@/data/adminStore";

export const Route = createFileRoute("/console/shifts")({
  head: () => ({ meta: [{ title: "Shifts — Shiftinger admin" }] }),
  component: ShiftsPage,
});

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "filled", label: "Filled" },
];

function ShiftEditor({ shift, onClose }: { shift: Shift | null; onClose: () => void }) {
  const store = useAdminStore();
  const [form, setForm] = useState<Shift | null>(shift);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(shift), [shift]);
  if (!form) return null;
  const set = (patch: Partial<Shift>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const save = async () => {
    setSaving(true);
    try {
      await store.saveShift({
        id: form.id,
        role: form.role,
        rate: form.rate,
        spots: form.spots,
        status: form.status,
        note: form.note,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        skills: form.skills,
      });
      toast.success("Shift updated");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save shift");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!shift} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-sans">Edit shift</DialogTitle>
          <DialogDescription>{maskBusiness(form.businessName, form.businessVerified)} · {form.city || "—"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Field label="Title / role" required>
            <TextInput value={form.role} onChange={(e) => set({ role: e.target.value })} />
          </Field>
          <Field label="Location" hint="Set by the business profile (area / city)">
            <TextInput value={form.city || "—"} disabled className="bg-mist text-slate" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date">
              <TextInput type="date" value={form.date ?? ""} onChange={(e) => set({ date: e.target.value || null })} />
            </Field>
            <Field label="Start time">
              <TextInput type="time" value={form.startTime ?? ""} onChange={(e) => set({ startTime: e.target.value || null })} />
            </Field>
            <Field label="End time">
              <TextInput type="time" value={form.endTime ?? ""} onChange={(e) => set({ endTime: e.target.value || null })} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Rate (€/h)">
              <TextInput type="number" min={0} step={0.5} value={form.rate} onChange={(e) => set({ rate: Number(e.target.value) })} />
            </Field>
            <Field label="Workers needed">
              <TextInput type="number" min={0} value={form.spots} onChange={(e) => set({ spots: Number(e.target.value) })} />
            </Field>
            <Field label="Status">
              <SelectInput value={form.status} onChange={(v) => set({ status: v as JobStatus })} options={STATUS_OPTIONS} />
            </Field>
          </div>
          <Field label="Required skills">
            <TagMultiSelect
              selected={form.skills}
              options={store.listFor("skill")}
              onChange={(v) => set({ skills: v })}
              onAddOption={(value) => store.upsertListOption({ listKey: "skill", value }).catch(() => {})}
              placeholder="New skill…"
            />
          </Field>
          <Field label="Description / note">
            <TextArea value={form.note} onChange={(e) => set({ note: e.target.value })} />
          </Field>
        </div>

        <DialogFooter>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShiftsPage() {
  const store = useAdminStore();
  const [editing, setEditing] = useState<Shift | null>(null);

  const columns: Col<Shift>[] = [
    {
      key: "business",
      label: "Business",
      value: (s) => maskBusiness(s.businessName, s.businessVerified),
      render: (s) => <span className="font-mono text-ink">{maskBusiness(s.businessName, s.businessVerified)}</span>,
    },
    { key: "role", label: "Role", value: (s) => s.role || "—" },
    { key: "date", label: "Date", value: (s) => s.date ?? "—" },
    {
      key: "rate",
      label: "Rate",
      value: (s) => s.rate,
      render: (s) => <span>€{s.rate.toFixed(2)}/h</span>,
    },
    { key: "spots", label: "Spots", value: (s) => `${s.spotsRemaining}/${s.spots}`, className: "text-center" },
    { key: "applications", label: "Apps", value: (s) => s.applications, className: "text-center" },
    {
      key: "status",
      label: "Status",
      value: (s) => s.status,
      render: (s) => <Pill tone={statusTone(s.status)}>{s.status}</Pill>,
    },
    {
      key: "actions",
      label: "",
      value: () => "",
      csv: false,
      render: () => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-pine-dark">
          <Pencil size={13} /> Edit
        </span>
      ),
    },
  ];

  if (store.loading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="animate-spin text-pine" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Shifts" subtitle={`${store.shifts.length} posted shifts`} />
      <ConsoleTable
        rows={store.shifts}
        columns={columns}
        rowKey={(s) => s.id}
        csvName="shifts"
        searchPlaceholder="Search by role, business, city…"
        search={(s) => `${s.businessName} ${s.role} ${s.city}`}
        filters={[
          {
            key: "status",
            label: "Status",
            field: (s) => s.status,
            options: [...new Set(store.shifts.map((s) => s.status))],
          },
        ]}
        rowClassName={() => "cursor-pointer"}
        empty="No shifts posted yet."
        onRowClick={(s) => setEditing(s)}
      />
      <ShiftEditor shift={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
