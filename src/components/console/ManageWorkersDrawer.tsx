import { useState } from "react";
import { Plus, Pencil, Ban, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Pill } from "@/components/console/ui";
import { PrimaryButton } from "@/components/console/forms";
import { WorkerDrawer } from "@/components/console/WorkerDrawer";
import { AddWorkerModal } from "@/components/console/AddWorkerModal";
import { useAdminStore, STATUS_LABEL, statusToneFor, type Worker } from "@/data/adminStore";

export function ManageWorkersDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Worker | null>(null);
  const [adding, setAdding] = useState(false);
  const [suspending, setSuspending] = useState<Worker | null>(null);

  const q = query.trim().toLowerCase();
  const rows = store.workers.filter((w) => !q || `${w.name} ${w.email} ${w.mainRole}`.toLowerCase().includes(q));

  const reactivate = async (w: Worker) => {
    try {
      await store.setStatus(w.id, "approved", "worker", w.name);
      toast.success("Worker reactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reactivate");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="flex w-full flex-col gap-0 bg-canvas p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-line bg-white px-6 py-4">
            <SheetTitle className="font-sans">Manage workers</SheetTitle>
            <SheetDescription>{store.workers.length} workers. Add, edit, suspend, reactivate or delete.</SheetDescription>
          </SheetHeader>

          <div className="flex items-center gap-2 border-b border-line bg-white px-6 py-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-line px-3 py-2">
              <Search size={15} className="text-slate" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search workers…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate/60"
              />
            </div>
            <PrimaryButton onClick={() => setAdding(true)}>
              <Plus size={15} /> Add
            </PrimaryButton>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <ul className="space-y-2">
              {rows.map((w) => {
                const suspended = w.status === "blocked";
                return (
                  <li key={w.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{w.name}</p>
                      <p className="truncate text-[11px] text-slate">{w.mainRole || "—"} · {w.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Pill tone={statusToneFor(w.status)}>{STATUS_LABEL[w.status]}</Pill>
                      <button onClick={() => setEditing(w)} title="Edit" className="text-slate hover:text-pine-dark">
                        <Pencil size={15} />
                      </button>
                      {suspended ? (
                        <button onClick={() => reactivate(w)} title="Reactivate" className="text-pine-dark hover:text-pine">
                          <RotateCcw size={15} />
                        </button>
                      ) : (
                        <button onClick={() => setSuspending(w)} title="Suspend" className="text-red-500 hover:text-red-700">
                          <Ban size={15} />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
              {rows.length === 0 && <li className="py-10 text-center text-sm text-slate">No workers found.</li>}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      <WorkerDrawer worker={editing} open={!!editing} onClose={() => setEditing(null)} />
      <AddWorkerModal open={adding} onClose={() => setAdding(false)} />

      <AlertDialog open={!!suspending} onOpenChange={(o) => !o && setSuspending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">Suspend {suspending?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The worker will be blocked from the platform until reactivated. Their account is not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!suspending) return;
                try {
                  await store.setStatus(suspending.id, "blocked", "worker", suspending.name);
                  toast.success("Worker suspended");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not suspend");
                } finally {
                  setSuspending(null);
                }
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
