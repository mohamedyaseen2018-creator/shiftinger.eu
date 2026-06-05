import { useState } from "react";
import {
  BadgeCheck,
  Send,
  Download,
  Power,
  Activity,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { downloadCsv } from "@/lib/csv";
import { WORKERS, SHIFTS, PLATFORM_HEALTH, businessById, maskBusiness } from "@/data/adminMock";

function ActionButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: typeof Send;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
        tone === "danger"
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-line text-ink hover:bg-mist"
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
          tone === "danger" ? "bg-red-50 text-red-600" : "bg-pine-soft text-pine-dark"
        }`}
      >
        <Icon size={17} />
      </span>
      {label}
    </button>
  );
}

export function QuickControls() {
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [maintenance, setMaintenance] = useState(false);

  const exportWorkers = () => {
    downloadCsv(
      "workers",
      ["Name", "Nationality", "Atividade", "Skills", "Total shifts", "Rating", "Status"],
      WORKERS.map((w) => [
        w.name,
        w.nationality,
        w.atividade ? "Yes" : "No",
        w.skills.join(" / "),
        w.totalShifts,
        w.rating,
        w.status,
      ]),
    );
    toast.success("Workers CSV exported");
  };

  const exportShifts = () => {
    downloadCsv(
      "shifts",
      ["Shift ID", "Business", "Role", "Date", "Time", "Pay", "Applications", "Status"],
      SHIFTS.map((s) => {
        const biz = businessById(s.businessId);
        return [
          s.id,
          biz ? maskBusiness(biz.name, s.confirmed) : "—",
          s.role,
          s.date,
          `${s.startTime}–${s.endTime}`,
          `€${s.pay}`,
          s.applications,
          s.status,
        ];
      }),
    );
    toast.success("Shifts CSV exported");
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <ActionButton
          icon={BadgeCheck}
          label="Approve pending verification"
          onClick={() => toast.success("Pending business verification approved")}
        />
        <ActionButton icon={Send} label="Notify all workers" onClick={() => setNotifyOpen(true)} />
        <ActionButton icon={Download} label="Export workers CSV" onClick={exportWorkers} />
        <ActionButton icon={Download} label="Export shifts CSV" onClick={exportShifts} />
        <ActionButton
          icon={Power}
          label={maintenance ? "Maintenance mode: ON" : "Toggle maintenance mode"}
          onClick={() => setMaintenanceOpen(true)}
          tone="danger"
        />
        <ActionButton icon={Activity} label="View platform health" onClick={() => setHealthOpen(true)} />
      </div>

      {/* Notify modal */}
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans">Send notification to all workers</DialogTitle>
            <DialogDescription>This message will be delivered to all 1,284 registered workers.</DialogDescription>
          </DialogHeader>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Write your message…"
            className="w-full rounded-xl border border-line bg-white p-3 text-sm text-ink outline-none focus:border-pine"
          />
          <DialogFooter>
            <button
              onClick={() => setNotifyOpen(false)}
              className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-mist"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!message.trim()) return toast.error("Message cannot be empty");
                toast.success("Notification sent to all workers");
                setMessage("");
                setNotifyOpen(false);
              }}
              className="rounded-xl bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-dark"
            >
              Send
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance confirm */}
      <AlertDialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-sans">
              {maintenance ? "Disable maintenance mode?" : "Enable maintenance mode?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {maintenance
                ? "The platform will return to normal operation for all users."
                : "Workers and businesses will see a maintenance page and cannot post or confirm shifts."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setMaintenance((m) => !m);
                toast.success(maintenance ? "Maintenance mode disabled" : "Maintenance mode enabled");
              }}
              className="rounded-xl bg-pine hover:bg-pine-dark"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Health modal */}
      <Dialog open={healthOpen} onOpenChange={setHealthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-sans">Platform health</DialogTitle>
            <DialogDescription>Live status of core services.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {PLATFORM_HEALTH.map((h) => (
              <li
                key={h.label}
                className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-sm"
              >
                <span className="text-ink">{h.label}</span>
                <span className={`inline-flex items-center gap-2 font-medium ${h.ok ? "text-pine-dark" : "text-red-600"}`}>
                  <span className={`h-2 w-2 rounded-full ${h.ok ? "bg-pine" : "bg-red-500"}`} />
                  {h.value}
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
