import { createFileRoute } from "@tanstack/react-router";
import { StatCard, Panel, PageHeader } from "@/components/console/ui";
import { ActivityFeed } from "@/components/console/ActivityFeed";
import { QuickControls } from "@/components/console/QuickControls";
import {
  ShiftsBarChart,
  NationalityDonut,
  RegistrationsLine,
  SectorsBar,
} from "@/components/console/Charts";
import { KPIS } from "@/data/adminMock";

export const Route = createFileRoute("/console/")({
  head: () => ({ meta: [{ title: "Overview — Shiftinger admin" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <div>
      <PageHeader title="Overview" subtitle="Platform performance at a glance" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {KPIS.map((k) => (
          <StatCard key={k.key} label={k.label} value={k.value} delta={k.delta} />
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Shifts confirmed vs unmatched (6 months)">
          <ShiftsBarChart />
        </Panel>
        <Panel title="Worker nationality breakdown">
          <NationalityDonut />
        </Panel>
        <Panel title="New worker registrations (8 weeks)">
          <RegistrationsLine />
        </Panel>
        <Panel title="Top 5 active business sectors">
          <SectorsBar />
        </Panel>
      </div>

      {/* Activity + quick controls */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Live activity" className="lg:col-span-1">
          <ActivityFeed />
        </Panel>
        <Panel title="Quick controls" className="lg:col-span-2">
          <QuickControls />
        </Panel>
      </div>
    </div>
  );
}
