import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Job, MatchCriterion } from "@/data/types";
import { formatDate } from "@/data/utils";

interface ApplyJobModalProps {
  job: Job | null;
  criteria?: MatchCriterion[];
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
}

const MAX_WORDS = 100;

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** True when applying outside the 07:00–12:00 Lisbon confirmation window for a next-day shift. */
function needsWindowWarning(job: Job): boolean {
  if (!job.date) return false;
  const lisbonNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Lisbon" }));
  const tomorrow = new Date(lisbonNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const jd = new Date(job.date + "T00:00:00");
  const isNextDay =
    jd.getDate() === tomorrow.getDate() &&
    jd.getMonth() === tomorrow.getMonth() &&
    jd.getFullYear() === tomorrow.getFullYear();
  const h = lisbonNow.getHours();
  return isNextDay && (h < 7 || h >= 12);
}

export default function ApplyJobModal({ job, criteria, open, submitting, onClose, onSubmit }: ApplyJobModalProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) setMessage("");
  }, [open, job?.id]);

  const words = useMemo(() => countWords(message), [message]);
  const overLimit = words > MAX_WORDS;

  if (!job) return null;

  const timeLabel = job.startTime && job.endTime ? `${job.startTime}–${job.endTime}` : null;
  const headerParts = [
    job.role,
    job.date ? formatDate(job.date) : job.type === "parttime" ? "Part-time" : null,
    timeLabel,
  ].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-2xl p-0 sm:w-full">
        <div className="p-5 sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="font-serif text-xl text-ink">
              Applying for: {headerParts.join(" · ")}
            </DialogTitle>
            <DialogDescription className="sr-only">Send your application for this shift</DialogDescription>
          </DialogHeader>

          {/* Job summary */}
          <div className="mt-4 space-y-1.5 rounded-xl bg-canvas/60 p-4 text-[13px] text-ink/80 ring-1 ring-ink/5">
            <p>📍 Area: <span className="font-medium text-ink">{job.area || "Shared after acceptance"}</span></p>
            <p>🎭 Role: <span className="font-medium text-ink">{job.role}</span></p>
            <p>⏱ Type: <span className="font-medium text-ink">{job.type === "single" ? "Single shift" : "Part-time"}</span></p>
            <p>💶 Pay: <span className="font-medium text-teal">€{job.rate}/hr</span></p>
            <p>
              🌐 Language required:{" "}
              <span className="font-medium text-ink">{job.languages.length ? job.languages.join(", ") : "None"}</span>
            </p>
            {job.skills.length > 0 && (
              <p>🏆 Skills: <span className="font-medium text-ink">{job.skills.join(", ")}</span></p>
            )}
          </div>

          {/* Match summary */}
          {criteria && criteria.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Your match</p>
              <div className="flex flex-wrap gap-1.5">
                {criteria.map((c, i) => (
                  <span
                    key={i}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      c.matched
                        ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                        : "bg-red-50 text-red-600 ring-1 ring-red-200"
                    }`}
                  >
                    {c.matched ? "✅" : "❌"} {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation window soft warning */}
          {needsWindowWarning(job) && (
            <div className="mt-4 rounded-md bg-gold/10 px-3 py-2 text-xs text-gold-dark ring-1 ring-gold/20">
              Note: confirmation window opens at 07:00 tomorrow.
            </div>
          )}

          {/* Worker message */}
          <div className="mt-4">
            <label htmlFor="apply-message" className="mb-1.5 block text-sm font-medium text-ink">
              Short message to the business <span className="font-normal text-ink/40">(max 100 words)</span>
            </label>
            <textarea
              id="apply-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Tell them briefly why you're a good fit for this shift..."
              className="w-full resize-none rounded-lg border-0 bg-canvas px-3 py-2.5 text-sm text-ink ring-1 ring-ink/10 placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <p className={`mt-1 text-right text-xs ${overLimit ? "font-semibold text-red-500" : "text-ink/40"}`}>
              {words}/{MAX_WORDS} words
            </p>
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-sm font-medium text-ink ring-1 ring-ink/15 transition-colors hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSubmit(message)}
              disabled={submitting || overLimit}
              className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-teal-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Send Application
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
