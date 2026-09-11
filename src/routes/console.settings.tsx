import { createFileRoute } from "@tanstack/react-router";
import { Shield, Loader2 } from "lucide-react";
import { PageHeader, Panel, Pill } from "@/components/console/ui";
import { PlatformListsPanel } from "@/components/console/PlatformListsPanel";
import { JobCatalogPanel } from "@/components/console/JobCatalogPanel";
import { useAdminStore } from "@/data/adminStore";
import { useAuth } from "@/lib/auth";
import { timeAgo } from "@/data/utils";

export const Route = createFileRoute("/console/settings")({
  head: () => ({ meta: [{ title: "Settings — Shiftinger admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const store = useAdminStore();
  const { user } = useAuth();

  if (store.loading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="animate-spin text-pine" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Platform configuration and activity" />

      <Panel title="Super admin">
        <p className="text-sm text-slate">
          You are signed in as <span className="font-medium text-ink">{user?.email}</span>. Manage admin emails and
          console access in the <span className="font-medium text-ink">Access</span> section.
        </p>
      </Panel>

      <Panel title="Platform lists" action={<Pill tone="slate">Dropdown options</Pill>}>
        <p className="mb-4 text-sm text-slate">
          Manage the options behind every dropdown across the console. Changes apply immediately to all forms.
        </p>
        <PlatformListsPanel />
      </Panel>

      <Panel title="Jobs & skills catalog" action={<Pill tone="slate">{store.jobCatalog.length} jobs</Pill>}>
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
    </div>
  );
}
