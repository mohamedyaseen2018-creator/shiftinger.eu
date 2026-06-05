import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, FileCheck2, FileX2, ExternalLink, Eye, BadgeCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Pill } from "@/components/console/ui";
import { ConsoleTable, type Col } from "@/components/console/ConsoleTable";
import { PrimaryButton, GhostButton } from "@/components/console/forms";
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
import { useAdminStore, STATUS_LABEL, statusToneFor, type Worker } from "@/data/adminStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/console/documents")({
  head: () => ({ meta: [{ title: "Documents — Shiftinger admin" }] }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const store = useAdminStore();
  const [viewing, setViewing] = useState<Worker | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [confirm, setConfirm] = useState<{ worker: Worker; verify: boolean } | null>(null);
  const [working, setWorking] = useState(false);

  const openDoc = async (w: Worker) => {
    setViewing(w);
    setDocUrl(null);
    if (!w.hasDocuments) return;
    setLoadingDoc(true);
    try {
      const url = await store.signWorkerDoc(w.id);
      setDocUrl(url);
      if (!url) toast.error("No document file found.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load document");
    } finally {
      setLoadingDoc(false);
    }
  };

  const columns: Col<Worker>[] = [
    { key: "name", label: "Name", value: (w) => w.name, render: (w) => <span className="font-medium text-ink">{w.name}</span> },
    { key: "email", label: "Email", value: (w) => w.email },
    { key: "nationality", label: "Nationality", value: (w) => w.nationality || "—" },
    {
      key: "cv",
      label: "CV",
      value: (w) => (w.hasCv ? "Yes" : "No"),
      className: "text-center",
      render: (w) => <Pill tone={w.hasCv ? "pine" : "red"}>{w.hasCv ? "Yes" : "No"}</Pill>,
    },
    {
      key: "docs",
      label: "ID document",
      value: (w) => (w.hasDocuments ? "Uploaded" : "Missing"),
      className: "text-center",
      render: (w) =>
        w.hasDocuments ? (
          <span className="inline-flex items-center gap-1 text-pine-dark"><FileCheck2 size={15} /> Uploaded</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-600"><FileX2 size={15} /> Missing</span>
        ),
    },
    {
      key: "verified",
      label: "Verified",
      value: (w) => (w.verified ? "Yes" : "No"),
      render: (w) =>
        w.verified ? <Pill tone="pine">Verified</Pill> : <Pill tone="amber">Unverified</Pill>,
    },
    {
      key: "review",
      label: "",
      value: () => "",
      csv: false,
      render: (w) => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-pine-dark">
          <Eye size={13} /> Review
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

  const withDocs = store.workers.filter((w) => w.hasDocuments).length;

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle={`${withDocs} of ${store.workers.length} workers have uploaded an ID document`}
      />
      <ConsoleTable
        rows={store.workers}
        columns={columns}
        rowKey={(w) => w.id}
        csvName="worker-documents"
        searchPlaceholder="Search by name, email…"
        search={(w) => `${w.name} ${w.email} ${w.nationality}`}
        filters={[
          {
            key: "docs",
            label: "ID document",
            field: (w) => (w.hasDocuments ? "Uploaded" : "Missing"),
            options: ["Uploaded", "Missing"],
          },
          {
            key: "verified",
            label: "Verified",
            field: (w) => (w.verified ? "Verified" : "Unverified"),
            options: ["Verified", "Unverified"],
          },
        ]}
        rowClassName={(w) =>
          cn("cursor-pointer", w.hasDocuments ? "bg-pine-soft/30 hover:bg-pine-soft/50" : "bg-red-50 hover:bg-red-100/70")
        }
        empty="No workers yet."
        onRowClick={openDoc}
      />

      {/* Review dialog */}
      <AlertDialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">
              {viewing?.name} — document review
            </AlertDialogTitle>
            <AlertDialogDescription>
              Review the uploaded ID document and CV, then confirm or reject verification.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {viewing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm">
                <span className="font-medium text-ink">Status</span>
                <Pill tone={statusToneFor(viewing.status)}>{STATUS_LABEL[viewing.status]}</Pill>
              </div>

              <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
                <p className="mb-2 font-medium text-ink">ID document</p>
                {loadingDoc ? (
                  <span className="inline-flex items-center gap-2 text-slate"><Loader2 size={14} className="animate-spin" /> Loading…</span>
                ) : docUrl ? (
                  <a href={docUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-pine-dark hover:underline">
                    <ExternalLink size={14} /> Open ID document (secure link)
                  </a>
                ) : (
                  <span className="text-red-600">No document uploaded.</span>
                )}
              </div>

              <div className="rounded-xl border border-line bg-white px-4 py-3 text-sm">
                <p className="mb-2 font-medium text-ink">CV / portfolio</p>
                {viewing.portfolioUrl ? (
                  <a href={viewing.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-pine-dark hover:underline">
                    <ExternalLink size={14} /> Open CV / portfolio
                  </a>
                ) : (
                  <span className="text-red-600">No CV uploaded.</span>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter className="flex-row flex-wrap items-center justify-end gap-2">
            <AlertDialogCancel className="rounded-xl">Close</AlertDialogCancel>
            {viewing && viewing.verified && (
              <GhostButton
                onClick={() => setConfirm({ worker: viewing, verify: false })}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <ShieldX size={15} /> Revoke verification
              </GhostButton>
            )}
            {viewing && !viewing.verified && (
              <PrimaryButton onClick={() => setConfirm({ worker: viewing, verify: true })}>
                <BadgeCheck size={15} /> Verify worker
              </PrimaryButton>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm verify / revoke */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">
              {confirm?.verify ? "Verify" : "Revoke verification for"} {confirm?.worker.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.verify
                ? "This marks the worker's documents as verified and makes their profile eligible to be browsed."
                : "This removes the verified badge from the worker."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={working}
              onClick={async (e) => {
                e.preventDefault();
                if (!confirm) return;
                setWorking(true);
                try {
                  await store.setWorkerVerified(confirm.worker.id, confirm.verify, confirm.worker.name);
                  toast.success(confirm.verify ? "Worker verified" : "Verification revoked");
                  setConfirm(null);
                  setViewing(null);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not update");
                } finally {
                  setWorking(false);
                }
              }}
              className="rounded-xl bg-pine hover:bg-pine-dark"
            >
              {working ? "Saving…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
