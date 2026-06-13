import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Loader2,
  MailPlus,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
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
import { PageHeader, Panel, Pill } from "@/components/console/ui";
import { Field, TextInput, PrimaryButton } from "@/components/console/forms";
import { useAdminStore, type AdminUser, type AdminEmail } from "@/data/adminStore";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/data/utils";

export const Route = createFileRoute("/console/access")({
  head: () => ({ meta: [{ title: "Access — Shiftinger admin" }] }),
  component: AccessPage,
});

function AccessPage() {
  const store = useAdminStore();
  const { user } = useAuth();

  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<AdminEmail | null>(null);
  const [revoking, setRevoking] = useState<AdminUser | null>(null);

  const addAdmin = async () => {
    const clean = newEmail.trim();
    if (!clean) return;
    setAdding(true);
    try {
      await store.addAdminEmail(clean, newNote.trim() || undefined);
      toast.success("Admin email added");
      setNewEmail("");
      setNewNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add admin email");
    } finally {
      setAdding(false);
    }
  };

  if (store.loading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="animate-spin text-pine" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access"
        subtitle="Manage admin emails and console access — separate from worker & business accounts"
      />

      <Panel title="Super admin">
        <p className="text-sm text-slate">
          You are signed in as <span className="font-medium text-ink">{user?.email}</span>. Admins have full access to
          every section of this console. Admin emails are kept separate from worker and business accounts — when
          someone signs up with an allowlisted email, their account is created as an admin instead of a worker or
          business.
        </p>
      </Panel>

      {/* Pre-authorized admin emails (allowlist) */}
      <Panel
        title="Admin emails"
        action={<Pill tone="pine">{store.adminEmails.length} allowlisted</Pill>}
      >
        <p className="mb-4 text-sm text-slate">
          Add an email here to grant admin access. If they already have an account, admin access is granted
          immediately. Otherwise, the next time they sign up with this email they’ll become an admin automatically —
          no worker or business profile is created.
        </p>

        <div className="mb-4 flex flex-wrap items-end gap-2">
          <Field label="Admin email" className="min-w-[220px] flex-1">
            <TextInput
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="person@example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") addAdmin();
              }}
            />
          </Field>
          <Field label="Note (optional)" className="min-w-[180px] flex-1">
            <TextInput
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Operations lead"
              onKeyDown={(e) => {
                if (e.key === "Enter") addAdmin();
              }}
            />
          </Field>
          <PrimaryButton onClick={addAdmin} disabled={adding}>
            <MailPlus size={15} /> {adding ? "Adding…" : "Add admin"}
          </PrimaryButton>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Note</th>
                <th className="px-4 py-3 font-semibold">Added</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {store.adminEmails.map((a) => {
                const isSelf = a.email.toLowerCase() === (user?.email ?? "").toLowerCase();
                return (
                  <tr key={a.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{a.email}</td>
                    <td className="px-4 py-3">
                      {a.registered ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-pine">
                          <CheckCircle2 size={13} /> Registered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate">
                          <Clock size={13} /> Invited
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/70">{a.note || "—"}</td>
                    <td className="px-4 py-3 text-[11px] text-slate">{timeAgo(a.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {isSelf ? (
                        <span className="text-xs text-slate">—</span>
                      ) : (
                        <button
                          onClick={() => setRemoving(a)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {store.adminEmails.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate">
                    No admin emails yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Current admin accounts */}
      <Panel title="Admin accounts" action={<Pill tone="pine">{store.admins.length} admins</Pill>}>
        <p className="mb-4 text-sm text-slate">
          Accounts that currently hold admin access. Revoking removes console access — the account itself is not
          deleted.
        </p>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {store.admins.map((a) => {
                const isSelf = a.id === user?.id;
                return (
                  <tr key={a.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-pine" />
                        {a.name}
                        {isSelf && <span className="text-[11px] text-slate">(you)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/80">{a.email}</td>
                    <td className="px-4 py-3">
                      <Pill tone="pine">{a.role === "admin" ? "Super admin" : a.role}</Pill>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSelf ? (
                        <span className="text-xs text-slate">—</span>
                      ) : (
                        <button
                          onClick={() => setRevoking(a)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={13} /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {store.admins.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate">
                    No admin users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Admin activity" action={<Shield size={16} className="text-slate" />}>
        {store.audit.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate">No admin activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {store.audit.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate text-ink">
                  <span className="font-medium">{a.action}</span>
                  {a.targetLabel ? ` · ${a.targetLabel}` : ""}
                </span>
                <span className="shrink-0 text-[11px] text-slate">
                  {a.adminEmail ? `${a.adminEmail} · ` : ""}
                  {timeAgo(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Remove allowlisted email */}
      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Remove admin email?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.email} will be removed from the allowlist. If they have an account, their admin access is
              revoked (the account is not deleted).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!removing) return;
                try {
                  await store.removeAdminEmail(removing.email);
                  toast.success("Admin email removed");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not remove admin email");
                } finally {
                  setRemoving(null);
                }
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke admin account */}
      <AlertDialog open={!!revoking} onOpenChange={(o) => !o && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Revoke admin access?</AlertDialogTitle>
            <AlertDialogDescription>
              {revoking?.name} ({revoking?.email}) will lose access to the admin console. Their account is not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!revoking) return;
                try {
                  await store.revokeAdmin(revoking.id);
                  toast.success("Admin access revoked");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not revoke admin access");
                } finally {
                  setRevoking(null);
                }
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
