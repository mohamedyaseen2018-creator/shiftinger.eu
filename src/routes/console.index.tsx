import { createFileRoute } from "@tanstack/react-router";
import { StatCard, Panel, PageHeader } from "@/components/console/ui";
import { ActivityFeed } from "@/components/console/ActivityFeed";
import { QuickControls } from "@/components/console/QuickControls";
import {
  NationalityDonut,
  BusinessCategoryBar,
  MatchStatusBar,
  ShiftStatusBar,
} from "@/components/console/Charts";
import { useAdminStore } from "@/data/adminStore";

export const Route = createFileRoute("/console/")({
  head: () => ({ meta: [{ title: "Overview — Shiftinger admin" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const { metrics } = useAdminStore();

  const cards = [
    { label: "Registered workers", value: String(metrics.workers) },
    { label: "Registered businesses", value: String(metrics.businesses) },
    { label: "Shifts posted", value: String(metrics.jobs) },
    { label: "Open shifts", value: String(metrics.openJobs) },
    { label: "Applications", value: String(metrics.applications) },
    { label: "Pending approvals", value: String(metrics.pendingApprovals) },
  ];

  return (
    <div>
      <PageHeader title="Overview" subtitle="Live platform data at a glance" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Worker nationality breakdown">
          <NationalityDonut />
        </Panel>
        <Panel title="Businesses by sector">
          <BusinessCategoryBar />
        </Panel>
        <Panel title="Applications by status">
          <MatchStatusBar />
        </Panel>
        <Panel title="Shifts by status">
          <ShiftStatusBar />
        </Panel>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Recent admin activity" className="lg:col-span-1">
          <ActivityFeed />
        </Panel>
        <Panel title="Quick controls" className="lg:col-span-2">
          <QuickControls />
        </Panel>
      </div>
    </div>
  );
}
