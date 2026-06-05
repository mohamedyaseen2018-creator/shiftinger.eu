import { useMemo, useState } from "react";
import { Plus, Pencil, Ban, RotateCcw, Trash2, Search } from "lucide-react";
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
import { Pill, statusTone } from "@/components/console/ui";
import { WorkerDrawer } from "@/components/console/WorkerDrawer";
import { useAdminStore, emptyWorker, type Worker } from "@/data/adminStore";

export function ManageWorkersDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useAdminStore();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Worker | null>(null);
  const [confirm, setConfirm] = useState<{ worker: Worker; action: "suspend" | "delete" } | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.workers.filter((w) => !q || `${w.name} ${w.city} ${w.skills.join(" ")}`.toLowerCase().includes(q));
  }, [store.workers, query]);

  const doConfirm = () => {
    if (!confirm) return;
    const { worker, action } = confirm;
    if (action === "delete") {
      store.removeWorker(worker.id);
      toast.success("Worker deleted");
    } else {
      const next = worker.status === "suspended" ? "active" : "suspended";
      store.upsertWorker({ ...worker, status: next });
      toast.success(next === "suspended" ? "Worker suspended" : "Worker reactivated");
    }
    setConfirm(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="flex w-full flex-col gap-0 bg-canvas p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-line bg-white px-6 py-4">
            <SheetTitle className="font-sans">Manage workers</SheetTitle>
            <SheetDescription>{store.workers.length} workers. Add, edit, suspend, or remove.</SheetDescription>
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
            <button
              onClick={() => setEditing(emptyWorker(store.newId()))}
              className="inline-flex items-center gap-1.5 rounded-xl bg-pine px-3 py-2 text-sm font-medium text-white hover:bg-pine-dark"
            >
              <Plus size={15} /> Add
            </button>
          </div>

          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {rows.map((w) => (
              <li key={w.id} className="flex items-center gap-3 px-6 py-3 hover:bg-mist/50">
                <span className="text-lg">{w.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{w.name || "Unnamed"}</p>
                  <p className="truncate text-[11px] text-slate">{w.city} · {w.skills.slice(0, 2).join(", ") || "No skills"}</p>
                </div>
                <Pill tone={statusTone(w.status)}>{w.status}</Pill>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(w)} className="rounded-lg p-1.5 text-slate hover:bg-mist hover:text-ink" title="Edit">
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setConfirm({ worker: w, action: "suspend" })}
                    className="rounded-lg p-1.5 text-slate hover:bg-amber-soft hover:text-amber-dark"
                    title={w.status === "suspended" ? "Reactivate" : "Suspend"}
                  >
                    {w.status === "suspended" ? <RotateCcw size={15} /> : <Ban size={15} />}
                  </button>
                  <button onClick={() => setConfirm({ worker: w, action: "delete" })} className="rounded-lg p-1.5 text-slate hover:bg-red-50 hover:text-red-600" title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
            {rows.length === 0 && <li className="px-6 py-10 text-center text-sm text-slate">No workers found.</li>}
          </ul>
        </SheetContent>
      </Sheet>

      <WorkerDrawer worker={editing} open={!!editing} onClose={() => setEditing(null)} />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">
              {confirm?.action === "delete"
                ? `Delete ${confirm.worker.name}?`
                : confirm?.worker.status === "suspended"
                  ? `Reactivate ${confirm.worker.name}?`
                  : `Suspend ${confirm?.worker.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "delete"
                ? "This permanently removes the worker and all their data."
                : "You can change this again at any time."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doConfirm}
              className={confirm?.action === "delete" ? "rounded-xl bg-red-600 hover:bg-red-700" : "rounded-xl bg-pine hover:bg-pine-dark"}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
