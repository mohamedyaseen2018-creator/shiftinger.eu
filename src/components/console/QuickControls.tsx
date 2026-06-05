import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, X, RefreshCw, Users, Building2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAdminStore } from "@/data/adminStore";
import { Pill } from "@/components/console/ui";

export function QuickControls() {
  const store = useAdminStore();
  const [busy, setBusy] = useState<string | null>(null);

  const pending = [
    ...store.workers
      .filter((w) => w.status === "pending_review")
      .map((w) => ({ id: w.id, name: w.name, type: "worker" as const })),
    ...store.businesses
      .filter((b) => b.status === "pending_review")
      .map((b) => ({ id: b.id, name: b.name, type: "business" as const })),
  ];

  const act = async (
    id: string,
    type: "worker" | "business",
    name: string,
    status: "approved" | "rejected",
  ) => {
    setBusy(id + status);
    try {
      await store.setStatus(id, status, type, name);
      toast.success(status === "approved" ? "Approved" : "Rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Link to="/console/workers" className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink hover:border-pine">
          <span className="inline-flex items-center gap-2"><Users size={15} /> Workers</span>
          <ArrowRight size={14} className="text-slate" />
        </Link>
        <Link to="/console/businesses" className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink hover:border-pine">
          <span className="inline-flex items-center gap-2"><Building2 size={15} /> Businesses</span>
          <ArrowRight size={14} className="text-slate" />
        </Link>
        <button
          onClick={() => store.refresh().then(() => toast.success("Refreshed"))}
          className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium text-ink hover:border-pine"
        >
          <span className="inline-flex items-center gap-2"><RefreshCw size={15} /> Refresh</span>
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Pending approvals</h3>
          <Pill tone={pending.length ? "amber" : "pine"}>{pending.length} waiting</Pill>
        </div>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line py-6 text-center text-sm text-slate">
            Nothing waiting for review.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.type === "business" ? store.businessLabel(p.name) : p.name}</p>
                  <p className="text-[11px] capitalize text-slate">{p.type}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => act(p.id, p.type, p.name, "approved")}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-1 rounded-lg bg-pine-soft px-2 py-1 text-xs font-medium text-pine-dark hover:bg-pine hover:text-white disabled:opacity-50"
                  >
                    <Check size={13} /> Approve
                  </button>
                  <button
                    onClick={() => act(p.id, p.type, p.name, "rejected")}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <X size={13} /> Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
