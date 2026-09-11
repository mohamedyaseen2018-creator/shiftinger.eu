import { useEffect, useState } from "react";
import { Loader2, Briefcase, Send, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ROLE_OPTIONS } from "@/data/utils";

interface ShiftOfferModalProps {
  workerId: string;
  workerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MyJob {
  id: string;
  role: string;
  rate: number;
  date: string | null;
  type: string;
}

const MINUTES = ["00", "15", "30", "45"];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

const inputCls =
  "w-full rounded-md border-0 bg-canvas px-3 py-2 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal";

function TimePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(":");
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink/60">{label}</label>
      <div className="flex items-center gap-1.5">
        <select value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)} className={inputCls}>
          {HOURS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <span className="text-ink/40">:</span>
        <select value={m} onChange={(e) => onChange(`${h}:${e.target.value}`)} className={inputCls}>
          {MINUTES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function ShiftOfferModal({ workerId, workerName, open, onOpenChange }: ShiftOfferModalProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"shifts" | "private">("shifts");
  const [myJobs, setMyJobs] = useState<MyJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Private offer fields
  const [role, setRole] = useState(ROLE_OPTIONS[0] ?? "");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [rate, setRate] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    setLoadingJobs(true);
    supabase
      .from("jobs")
      .select("id, role, rate, date, type")
      .eq("owner_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMyJobs((data ?? []) as MyJob[]);
        setLoadingJobs(false);
      });
  }, [open, user]);

  const sendFromShift = async () => {
    if (!selectedJob) {
      toast.error("Select one of your shifts.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("create_shift_offer", { _worker_id: workerId, _job_id: selectedJob });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Could not send offer.");
      return;
    }
    toast.success(`Shift offer sent to ${workerName}.`);
    onOpenChange(false);
  };

  const sendPrivate = async () => {
    if (!role || !date || !rate) {
      toast.error("Fill in role, date and pay rate.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("create_private_offer", {
      _worker_id: workerId,
      _role: role,
      _date: date,
      _start: start,
      _end: end,
      _rate: Number(rate),
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Could not send offer.");
      return;
    }
    toast.success(`Private offer sent to ${workerName}.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg rounded-2xl p-0 sm:w-full">
        <DialogHeader className="border-b border-ink/5 p-5 text-left">
          <DialogTitle className="font-serif text-xl text-ink">Send shift offer</DialogTitle>
          <DialogDescription className="text-sm text-ink/60">Offer a shift directly to {workerName}.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b border-ink/5 px-5 pt-3">
          <button
            onClick={() => setTab("shifts")}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "shifts" ? "border-b-2 border-teal text-teal" : "text-ink/50 hover:text-ink"}`}
          >
            From my shifts
          </button>
          <button
            onClick={() => setTab("private")}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "private" ? "border-b-2 border-teal text-teal" : "text-ink/50 hover:text-ink"}`}
          >
            Private offer
          </button>
        </div>

        <div className="p-5">
          {tab === "shifts" ? (
            <div className="space-y-3">
              {loadingJobs ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-teal" /></div>
              ) : myJobs.length === 0 ? (
                <p className="rounded-lg bg-canvas p-4 text-sm text-ink/50">
                  You have no open shifts. Post a shift first, or use the Private offer tab.
                </p>
              ) : (
                <div className="space-y-2">
                  {myJobs.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => setSelectedJob(j.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl p-3 text-left ring-1 transition-colors ${selectedJob === j.id ? "bg-teal/5 ring-teal" : "bg-canvas ring-ink/5 hover:bg-ink/5"}`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        <Briefcase size={15} className="text-teal" /> {j.role}
                      </span>
                      <span className="text-xs text-ink/50">€{j.rate}/hr{j.date ? ` · ${j.date}` : ""}</span>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={sendFromShift}
                disabled={submitting || !selectedJob}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-teal px-4 py-2.5 text-sm font-medium text-canvas hover:bg-teal-light disabled:opacity-50"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send offer
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink/60">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink/60">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TimePicker label="Start time" value={start} onChange={setStart} />
                <TimePicker label="End time" value={end} onChange={setEnd} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink/60">Pay rate (€/hr)</label>
                <input type="number" min="0" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 12" className={inputCls} />
              </div>
              <button
                onClick={sendPrivate}
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-teal px-4 py-2.5 text-sm font-medium text-canvas hover:bg-teal-light disabled:opacity-50"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send private offer
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
