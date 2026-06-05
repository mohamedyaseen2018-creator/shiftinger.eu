import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, ShieldCheck, Trash2, UserPlus, Loader2 } from "lucide-react";
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
import { PlatformListsPanel } from "@/components/console/PlatformListsPanel";
import { useAdminStore, type AdminUser } from "@/data/adminStore";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/data/utils";

export const Route = createFileRoute("/console/settings")({
  head: () => ({ meta: [{ title: "Settings — Shiftinger admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const store = useAdminStore();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState<AdminUser | null>(null);

  const grant = async () => {
    const clean = email.trim();
    if (!clean) return;
    setGranting(true);
    try {
      await store.grantAdmin(clean);
      toast.success("Admin access granted");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not grant admin access");
    } finally {
      setGranting(false);
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
      <PageHeader title="Settings" subtitle="Admin access and platform activity" />

      <Panel title="Super admin">
        <p className="text-sm text-slate">
          You are signed in as <span className="font-medium text-ink">{user?.email}</span>. Super admins have full
          access to every section of this console and can grant or revoke admin access for other accounts.
        </p>
      </Panel>

      <Panel
        title="Admin users"
        action={<Pill tone="pine">{store.admins.length} admins</Pill>}
      >
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <Field label="Grant admin access by email" className="min-w-[240px] flex-1">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@example.com"
              onKeyDown={(e) => {
                if (e.key === "Enter") grant();
              }}
            />
          </Field>
          <PrimaryButton onClick={grant} disabled={granting}>
            <UserPlus size={15} /> {granting ? "Granting…" : "Grant admin"}
          </PrimaryButton>
        </div>

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

      <Panel title="Platform lists" action={<Pill tone="slate">Dropdown options</Pill>}>
        <p className="mb-4 text-sm text-slate">
          Manage the options behind every dropdown across the console. Changes apply immediately to all forms.
        </p>
        <PlatformListsPanel />
      </Panel>

      <Panel title="Jobs & skills catalog" action={<Pill tone="slate">{jobCatalogCount} jobs</Pill>}>
        <p className="mb-4 text-sm text-slate">
          The job roles and their skills shown in forms and on the website. Expand a job to edit its skills.
        </p>
        <JobCatalogPanel />
      </Panel>

      <Panel title="Audit log" action={<Shield size={16} className="text-slate" />}>

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
