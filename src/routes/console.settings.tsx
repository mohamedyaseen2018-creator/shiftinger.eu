import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/components/console/ui";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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
import { ManagedList } from "@/components/console/ManagedList";
import { Field, TextInput, SelectInput, PrimaryButton, GhostButton } from "@/components/console/forms";
import { useAdminStore, LIST_META, type AdminUser } from "@/data/adminStore";
import { timeAgo } from "@/data/utils";

export const Route = createFileRoute("/console/settings")({
  head: () => ({ meta: [{ title: "Settings — Shiftinger admin" }] }),
  component: SettingsPage,
});

const WEIGHT_KEYS = [
  { key: "skills", label: "Skills match" },
  { key: "availability", label: "Availability" },
  { key: "rating", label: "Rating" },
  { key: "location", label: "Location" },
] as const;

const EVENTS = [
  "New worker registration",
  "Shift confirmed",
  "Application nearing expiry",
  "Dispute raised",
  "Business verification",
] as const;

function SettingsPage() {
  const store = useAdminStore();
  const [start, setStart] = useState(store.window.start);
  const [end, setEnd] = useState(store.window.end);

  useEffect(() => {
    setStart(store.window.start);
    setEnd(store.window.end);
  }, [store.window.start, store.window.end]);

  const [weights, setWeights] = useState<Record<string, number>>({ skills: 40, availability: 25, rating: 20, location: 15 });
  const [alerts, setAlerts] = useState<Record<string, { email: boolean; sms: boolean }>>(
    Object.fromEntries(EVENTS.map((e) => [e, { email: true, sms: false }])),
  );

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform configuration, lists, and admin management" />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Confirmation window */}
        <Panel title="Confirmation window">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Window opens (Lisbon)">
              <TextInput type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Window closes (Lisbon)">
              <TextInput type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
          <PrimaryButton
            className="mt-4"
            onClick={() => {
              if (start >= end) return toast.error("End time must be after start time");
              store.setWindow({ start, end });
              toast.success("Confirmation window saved");
            }}
          >
            Save changes
          </PrimaryButton>
        </Panel>

        {/* Match scoring weights */}
        <Panel title="Match scoring weights">
          <div className="space-y-5">
            {WEIGHT_KEYS.map((w) => (
              <div key={w.key}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-ink">{w.label}</span>
                  <span className="font-semibold text-pine-dark">{weights[w.key]}%</span>
                </div>
                <Slider value={[weights[w.key]]} min={0} max={100} step={5} onValueChange={(v) => setWeights((p) => ({ ...p, [w.key]: v[0] }))} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate">
            Total: <span className="font-semibold text-ink">{Object.values(weights).reduce((a, b) => a + b, 0)}%</span>
            {Object.values(weights).reduce((a, b) => a + b, 0) !== 100 && " — should sum to 100%"}
          </p>
        </Panel>

        {/* Platform lists */}
        <Panel title="Platform lists" className="lg:col-span-2">
          <p className="mb-3 text-xs text-slate">
            Edit, reorder, and hide options. Changes apply immediately to every dropdown across the console.
          </p>
          <Accordion type="single" collapsible className="w-full">
            {LIST_META.map((m) => (
              <AccordionItem key={m.key} value={m.key}>
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2">
                    {m.label}
                    <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-normal text-slate">
                      {store.lists[m.key].filter((o) => o.active).length} active
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-3 text-[11px] text-slate">{m.help}</p>
                  <ManagedList listKey={m.key} label={m.label.toLowerCase()} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Panel>

        {/* Notification settings */}
        <Panel title="Notification settings" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="py-2 font-semibold">Event</th>
                  <th className="py-2 text-center font-semibold">Email</th>
                  <th className="py-2 text-center font-semibold">SMS</th>
                </tr>
              </thead>
              <tbody>
                {EVENTS.map((e) => (
                  <tr key={e} className="border-t border-line">
                    <td className="py-3 text-ink">{e}</td>
                    <td className="py-3 text-center">
                      <Switch checked={alerts[e].email} onCheckedChange={(v) => setAlerts((p) => ({ ...p, [e]: { ...p[e], email: v } }))} />
                    </td>
                    <td className="py-3 text-center">
                      <Switch checked={alerts[e].sms} onCheckedChange={(v) => setAlerts((p) => ({ ...p, [e]: { ...p[e], sms: v } }))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Admin users */}
        <Panel
          title="Admin users"
          className="lg:col-span-2"
          action={
            <button
              onClick={() => setEditUser({ id: store.newId(), name: "", email: "", role: store.activeOptions("adminRoles")[0] ?? "Support", lastActive: new Date().toISOString() })}
              className="inline-flex items-center gap-1.5 rounded-xl bg-pine px-3 py-2 text-sm font-medium text-white hover:bg-pine-dark"
            >
              <Plus size={15} /> Add admin
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="py-2 font-semibold">Name</th>
                  <th className="py-2 font-semibold">Email</th>
                  <th className="py-2 font-semibold">Role</th>
                  <th className="py-2 font-semibold">Last active</th>
                  <th className="py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {store.adminUsers.map((u) => (
                  <tr key={u.id} className="border-t border-line">
                    <td className="py-3 font-medium text-ink">
                      <span className="inline-flex items-center gap-2">
                        <Shield size={14} className="text-pine" />
                        {u.name}
                      </span>
                    </td>
                    <td className="py-3 text-slate">{u.email}</td>
                    <td className="py-3">
                      <Pill tone={u.role === "Super admin" ? "pine" : "slate"}>{u.role}</Pill>
                    </td>
                    <td className="py-3 text-slate">{timeAgo(u.lastActive)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditUser(u)} className="rounded-lg p-1.5 text-slate hover:bg-mist hover:text-ink" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteUser(u)} className="rounded-lg p-1.5 text-slate hover:bg-red-50 hover:text-red-600" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <AdminUserDialog user={editUser} onClose={() => setEditUser(null)} />

      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Remove {deleteUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This admin will lose access to the console.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteUser) store.removeAdminUser(deleteUser.id);
                toast.success("Admin removed");
                setDeleteUser(null);
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdminUserDialog({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const store = useAdminStore();
  const [form, setForm] = useState<AdminUser | null>(user);
  useEffect(() => setForm(user), [user]);
  if (!form) return null;
  const isNew = !store.adminUsers.some((u) => u.id === form.id);

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">{isNew ? "Add admin user" : "Edit admin user"}</DialogTitle>
          <DialogDescription>Admin users can access the console.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <TextInput value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Role">
            <SelectInput value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={store.activeOptions("adminRoles")} />
          </Field>
        </div>
        <DialogFooter>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton
            onClick={() => {
              if (!form.name.trim() || !form.email.trim()) return toast.error("Name and email are required");
              store.upsertAdminUser(form);
              toast.success(isNew ? "Admin added" : "Admin updated");
              onClose();
            }}
          >
            Save
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
