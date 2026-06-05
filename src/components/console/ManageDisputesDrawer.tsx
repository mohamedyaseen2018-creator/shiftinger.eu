import { useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Pill } from "@/components/console/ui";
import { PrimaryButton } from "@/components/console/forms";
import { DisputeModal } from "@/components/console/DisputeModal";
import { useAdminStore, DISPUTE_STATUS_LABEL, disputeStatusTone, type Dispute } from "@/data/adminStore";

export function ManageDisputesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Dispute | null>(null);
  const [creating, setCreating] = useState(false);

  const q = query.trim().toLowerCase();
  const rows = store.disputes.filter(
    (d) => !q || `${d.title} ${d.workerLabel} ${d.businessLabel} ${d.issueType}`.toLowerCase().includes(q),
  );

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="flex w-full flex-col gap-0 bg-canvas p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-line bg-white px-6 py-4">
            <SheetTitle className="font-sans">Disputes</SheetTitle>
            <SheetDescription>{store.disputes.length} disputes. Review, assign, and resolve.</SheetDescription>
          </SheetHeader>

          <div className="flex items-center gap-2 border-b border-line bg-white px-6 py-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-line px-3 py-2">
              <Search size={15} className="text-slate" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search disputes…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate/60"
              />
            </div>
            <PrimaryButton onClick={() => setCreating(true)}>
              <Plus size={15} /> New
            </PrimaryButton>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <ul className="space-y-2">
              {rows.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => setEditing(d)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-left hover:border-pine"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{d.title}</p>
                      <p className="truncate text-[11px] text-slate">
                        {d.issueType || "—"}{d.businessLabel ? ` · ${d.businessLabel}` : ""}{d.workerLabel ? ` · ${d.workerLabel}` : ""}
                      </p>
                    </div>
                    <Pill tone={disputeStatusTone(d.status)}>{DISPUTE_STATUS_LABEL[d.status] ?? d.status}</Pill>
                  </button>
                </li>
              ))}
              {rows.length === 0 && <li className="py-10 text-center text-sm text-slate">No disputes found.</li>}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      <DisputeModal dispute={editing} open={!!editing} onClose={() => setEditing(null)} />
      <DisputeModal dispute={null} open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
