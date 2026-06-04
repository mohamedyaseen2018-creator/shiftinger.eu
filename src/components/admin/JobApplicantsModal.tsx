import { X, UserRound } from "lucide-react";

export interface Applicant {
  workerId: string;
  name: string;
  email: string;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  applied: "Applied",
  matched: "Matched",
  rejected: "Rejected by business",
  confirmed: "Confirmed",
  working: "Working",
  completed: "Completed",
  cancelled: "Cancelled",
};
const STATUS_CLS: Record<string, string> = {
  applied: "bg-ink/5 text-ink/60",
  matched: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-600",
  confirmed: "bg-teal/10 text-teal",
  working: "bg-teal/10 text-teal",
  completed: "bg-teal/10 text-teal",
  cancelled: "bg-red-50 text-red-600",
};

export default function JobApplicantsModal({
  title,
  applicants,
  onClose,
}: {
  title: string;
  applicants: Applicant[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 ring-1 ring-ink/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-serif text-xl text-ink">Applicants</h3>
            <p className="text-sm text-ink/55">{title}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink/50 hover:bg-ink/5">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">
          {applicants.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/50">No one has applied to this job yet.</p>
          ) : (
            <ul className="space-y-2">
              {applicants.map((a) => (
                <li
                  key={a.workerId}
                  className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2.5 ring-1 ring-ink/5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                      <UserRound size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                      <p className="truncate text-xs text-ink/50">{a.email}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_CLS[a.status] ?? "bg-ink/5 text-ink/60"
                    }`}
                  >
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
