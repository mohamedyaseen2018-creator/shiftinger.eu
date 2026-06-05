import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, BadgeCheck, Star, Plus } from "lucide-react";
import { PageHeader, Pill, statusTone } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import { BusinessModal } from "@/components/console/BusinessModal";
import { useAdminStore, emptyBusiness, type Business } from "@/data/adminStore";

export const Route = createFileRoute("/console/businesses")({
  head: () => ({ meta: [{ title: "Businesses — Shiftinger admin" }] }),
  component: BusinessesPage,
});

function label(b: Business): string {
  return b.confirmed ? b.name : b.initials;
}

function BusinessesPage() {
  const store = useAdminStore();
  const [editing, setEditing] = useState<Business | null>(null);

  const columns: Col<Business>[] = [
    {
      key: "name",
      label: "Business",
      value: (b) => label(b),
      render: (b) => <span className="font-mono font-medium text-ink">{label(b)}</span>,
    },
    { key: "city", label: "City", value: (b) => b.city },
    { key: "sector", label: "Sector", value: (b) => b.sector },
    { key: "shiftsPosted", label: "Shifts posted", value: (b) => b.shiftsPosted, className: "text-center" },
    {
      key: "avgRating",
      label: "Avg rating",
      value: (b) => b.avgRating,
      render: (b) => (
        <span className="inline-flex items-center gap-1">
          <Star size={13} className="fill-amber text-amber" />
          {b.avgRating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "verification",
      label: "Verification",
      value: (b) => b.verification,
      render: (b) =>
        b.verification === "verified" ? (
          <Pill tone="pine">
            <BadgeCheck size={12} /> Verified
          </Pill>
        ) : b.verification === "suspended" ? (
          <Pill tone="red">Suspended</Pill>
        ) : (
          <Pill tone="amber">Pending</Pill>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      value: () => "",
      csv: false,
      render: (b) => (
        <button
          onClick={() => setEditing(b)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate hover:bg-mist hover:text-ink"
          title="Edit"
        >
          <Pencil size={15} /> Edit
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Businesses"
        subtitle="Names shown as initials until a shift is mutually confirmed"
        action={
          <button
            onClick={() => setEditing(emptyBusiness(store.newId()))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-dark"
          >
            <Plus size={15} /> Add business
          </button>
        }
      />
      <ConsoleTable
        rows={store.businesses}
        columns={columns}
        rowKey={(b) => b.id}
        csvName="businesses"
        searchPlaceholder="Search by sector or city…"
        search={(b) => `${label(b)} ${b.sector} ${b.city}`}
        filters={[
          { key: "city", label: "City", field: (b) => b.city, options: store.activeOptions("cities") },
          { key: "sector", label: "Sector", field: (b) => b.sector, options: store.activeOptions("sectors") },
        ]}
      />
      <BusinessModal business={editing} open={!!editing} onClose={() => setEditing(null)} />
    </div>
  );
}
