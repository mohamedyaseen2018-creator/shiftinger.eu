import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Star, BadgeCheck } from "lucide-react";
import { PageHeader, Pill } from "@/components/console/ui";
import { BusinessModal } from "@/components/console/BusinessModal";
import { useAdminStore, STATUS_LABEL, statusToneFor } from "@/data/adminStore";

export const Route = createFileRoute("/console/businesses/$businessId")({
  head: () => ({ meta: [{ title: "Business profile — Shiftinger admin" }] }),
  component: BusinessProfilePage,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-slate">{label}</span>
      <span className="text-sm text-ink">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function BusinessProfilePage() {
  const { businessId } = Route.useParams();
  const store = useAdminStore();
  const [editing, setEditing] = useState(false);
  const business = store.businesses.find((b) => b.id === businessId);

  if (!business) {
    return (
      <div className="p-6">
        <Link to="/console/businesses" className="inline-flex items-center gap-1.5 text-sm text-pine-dark hover:underline">
          <ArrowLeft size={15} /> Back to businesses
        </Link>
        <p className="mt-6 text-sm text-slate">Business not found.</p>
      </div>
    );
  }

  const tags = (arr: string[]) =>
    arr.length ? (
      <span className="flex flex-wrap justify-end gap-1">
        {arr.map((t) => (
          <Pill key={t} tone="slate">{t}</Pill>
        ))}
      </span>
    ) : (
      "—"
    );

  return (
    <div className="space-y-5">
      <Link to="/console/businesses" className="inline-flex items-center gap-1.5 text-sm text-pine-dark hover:underline">
        <ArrowLeft size={15} /> Back to businesses
      </Link>

      <PageHeader
        title={business.name || "Business"}
        subtitle={business.email}
        action={
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-3.5 py-2 text-sm font-medium text-white hover:bg-pine-dark"
          >
            <Pencil size={15} /> Edit profile
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={statusToneFor(business.status)}>{STATUS_LABEL[business.status]}</Pill>
        {business.verified && (
          <Pill tone="pine"><span className="inline-flex items-center gap-1"><BadgeCheck size={12} /> Verified</span></Pill>
        )}
        {business.isEarlyBird && <Pill tone="amber">Early bird</Pill>}
        <Pill tone="amber"><span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber text-amber" /> {business.rating.toFixed(1)} ({business.ratingCount})</span></Pill>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Business details">
          <Row label="Business name (internal)" value={business.name} />
          <Row label="Display initials" value={business.displayInitials} />
          <Row label="Sector" value={business.category} />
          <Row label="Sub-sector" value={business.subSector} />
          <Row label="Description" value={business.description} />
        </Section>

        <Section title="Legal & tax">
          <Row label="NIF (tax number)" value={business.nif} />
          <Row label="Alvará number" value={business.alvara} />
        </Section>

        <Section title="Contact & address">
          <Row label="Contact name" value={business.contactName} />
          <Row label="Contact email" value={business.email} />
          <Row label="Contact phone" value={business.contactPhone} />
          <Row label="City" value={business.city} />
          <Row label="Area / address" value={business.area} />
        </Section>

        <Section title="Status & preferences">
          <Row label="Verification status" value={STATUS_LABEL[business.status]} />
          <Row label="Verified" value={business.verified ? "Yes" : "No"} />
          <Row label="Languages required" value={tags(business.languagesRequired)} />
          <Row label="Preferred roles" value={tags(business.preferredRoles)} />
          <Row label="Admin notes" value={business.adminNotes} />
        </Section>
      </div>

      <BusinessModal business={editing ? business : null} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
