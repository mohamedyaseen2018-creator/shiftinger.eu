import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Pencil, Star, BadgeCheck, ShieldCheck } from "lucide-react";
import { PageHeader, Pill } from "@/components/console/ui";
import { WorkerDrawer } from "@/components/console/WorkerDrawer";
import { useAdminStore, STATUS_LABEL, statusToneFor } from "@/data/adminStore";

export const Route = createFileRoute("/console/workers/$workerId")({
  head: () => ({ meta: [{ title: "Worker profile — Shiftinger admin" }] }),
  component: WorkerProfilePage,
});

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-slate">{label}</span>
      <span className="text-sm text-ink">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-2 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function WorkerProfilePage() {
  const { workerId } = Route.useParams();
  const store = useAdminStore();
  const [editing, setEditing] = useState(false);
  const worker = store.workers.find((w) => w.id === workerId);

  if (!worker) {
    return (
      <div className="p-6">
        <Link to="/console/workers" className="inline-flex items-center gap-1.5 text-sm text-pine-dark hover:underline">
          <ArrowLeft size={15} /> Back to workers
        </Link>
        <p className="mt-6 text-sm text-slate">Worker not found.</p>
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
      <Link to="/console/workers" className="inline-flex items-center gap-1.5 text-sm text-pine-dark hover:underline">
        <ArrowLeft size={15} /> Back to workers
      </Link>

      <PageHeader
        title={worker.name || "Worker"}
        subtitle={worker.email}
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
        <Pill tone={statusToneFor(worker.status)}>{STATUS_LABEL[worker.status]}</Pill>
        {worker.verified && (
          <Pill tone="pine"><span className="inline-flex items-center gap-1"><ShieldCheck size={12} /> ID verified</span></Pill>
        )}
        {worker.haccpVerified && (
          <Pill tone="blue"><span className="inline-flex items-center gap-1"><BadgeCheck size={12} /> HACCP</span></Pill>
        )}
        <Pill tone="amber"><span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber text-amber" /> {worker.rating.toFixed(1)} ({worker.ratingCount})</span></Pill>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Contact">
          <Row label="Full name" value={worker.name} />
          <Row label="Email" value={worker.email} />
          <Row label="Phone" value={worker.phone} />
          <Row label="Nationality" value={worker.nationality} />
          <Row label="City / location" value={worker.city} />
        </Section>

        <Section title="Skills & roles">
          <Row label="Main role" value={worker.mainRole} />
          <Row label="Years experience" value={worker.mainRoleYears ? `${worker.mainRoleYears} yrs` : "—"} />
          <Row label="Other roles" value={tags(worker.subRoles)} />
          <Row label="Languages" value={tags(worker.languages)} />
          <Row label="Min rate" value={worker.minRate ? `€${worker.minRate}/h` : "—"} />
        </Section>

        <Section title="Availability">
          <Row label="Looking for" value={tags(worker.lookingFor)} />
          <Row label="Available days" value={tags(worker.availableDays)} />
          <Row label="Time slots" value={tags(worker.timeSlots)} />
          <Row label="Visible in talent feed" value={worker.availabilityVisible ? "Yes" : "No"} />
        </Section>

        <Section title="Verification & status">
          <Row label="Account status" value={STATUS_LABEL[worker.status]} />
          <Row label="ID verified" value={worker.verified ? "Yes" : "No"} />
          <Row label="HACCP certified" value={worker.haccpVerified ? "Yes" : "No"} />
          <Row label="Atividade" value={worker.atividade ? worker.atividadeNumber || "Yes" : "No"} />
          <Row label="Shifts completed" value={worker.shiftsCompleted} />
        </Section>

        <Section title="Notes & bio">
          <Row label="Bio" value={worker.bio} />
          <Row label="Portfolio" value={worker.portfolioUrl ? <a href={worker.portfolioUrl} target="_blank" rel="noreferrer" className="text-pine-dark hover:underline">Link</a> : "—"} />
          <Row label="Admin notes" value={worker.adminNotes} />
        </Section>
      </div>

      <WorkerDrawer worker={editing ? worker : null} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
