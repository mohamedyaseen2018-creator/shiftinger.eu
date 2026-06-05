import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Loader2, BadgeCheck, Pencil } from "lucide-react";
import { PageHeader, Pill } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import { BusinessModal } from "@/components/console/BusinessModal";
import {
  useAdminStore,
  STATUS_LABEL,
  statusToneFor,
  maskBusiness,
  type Business,
} from "@/data/adminStore";

export const Route = createFileRoute("/console/businesses")({
  head: () => ({ meta: [{ title: "Businesses — Shiftinger admin" }] }),
  component: BusinessesPage,
});

function label(b: Business): string {
  return maskBusiness(b.name, b.verified);
}

function BusinessesPage() {
  const store = useAdminStore();
  const [editing, setEditing] = useState<Business | null>(null);

  const columns: Col<Business>[] = [
    { key: "name", label: "Business", value: (b) => label(b), render: (b) => <span className="font-mono font-medium text-ink">{label(b)}</span> },
    { key: "city", label: "City", value: (b) => b.city || "—" },
    { key: "category", label: "Sector", value: (b) => b.category || "—" },
    { key: "contact", label: "Contact", value: (b) => b.contactName || "—" },
    {
      key: "rating",
      label: "Rating",
      value: (b) => b.rating,
      render: (b) => (
        <span className="inline-flex items-center gap-1">
          <Star size={13} className="fill-amber text-amber" />
          {b.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      value: (b) => STATUS_LABEL[b.status],
      render: (b) => (
        <span className="inline-flex items-center gap-1.5">
          <Pill tone={statusToneFor(b.status)}>{STATUS_LABEL[b.status]}</Pill>
          {b.verified && <BadgeCheck size={14} className="text-pine" />}
        </span>
      ),
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
      <PageHeader title="Businesses" subtitle={`${store.businesses.length} registered businesses`} />
      <ConsoleTable
        rows={store.businesses}
        columns={columns}
        rowKey={(b) => b.id}
        csvName="businesses"
        searchPlaceholder="Search by name, city, sector…"
        search={(b) => `${b.name} ${b.city} ${b.category} ${b.contactName}`}
        filters={[
          {
            key: "status",
            label: "Status",
            field: (b) => STATUS_LABEL[b.status],
            options: [...new Set(store.businesses.map((b) => STATUS_LABEL[b.status]))],
          },
        ]}
        rowClassName={() => "cursor-pointer"}
        empty="No businesses yet."
        onRowClick={(b) => setEditing(b)}
      />
      <BusinessModal business={editing} open={!!editing} onClose={() => setEditing(null)} />
    </div>
  );
}
