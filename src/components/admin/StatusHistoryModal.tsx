import { useEffect, useState } from "react";
import { X, Loader2, CircleDot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HistoryRow {
  id: string;
  status: string;
  changed_by: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  incomplete: "Submitted / form started",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  blocked: "Blocked",
};
const STATUS_COLOR: Record<string, string> = {
  incomplete: "text-ink/40",
  pending_review: "text-amber-600",
  approved: "text-teal",
  rejected: "text-red-600",
  blocked: "text-red-600",
};

export default function StatusHistoryModal({
  profileId,
  title,
  emailById,
  onClose,
}: {
  profileId: string;
  title: string;
  emailById: Record<string, string>;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profile_status_history")
        .select("id, status, changed_by, created_at")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: true });
      setRows((data ?? []) as HistoryRow[]);
      setLoading(false);
    })();
  }, [profileId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 ring-1 ring-ink/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-serif text-xl text-ink">Status history</h3>
            <p className="text-sm text-ink/55">{title}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink/50 hover:bg-ink/5">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-teal" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/50">No history recorded yet.</p>
          ) : (
            <ol className="relative space-y-5 border-l border-ink/10 pl-6">
              {rows.map((r) => (
                <li key={r.id} className="relative">
                  <CircleDot
                    size={15}
                    className={`absolute -left-[30px] top-0.5 bg-white ${STATUS_COLOR[r.status] ?? "text-ink/40"}`}
                  />
                  <p className={`text-sm font-medium ${STATUS_COLOR[r.status] ?? "text-ink"}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </p>
                  <p className="mt-0.5 text-xs text-ink/50">
                    {new Date(r.created_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {r.changed_by && emailById[r.changed_by] ? ` · by ${emailById[r.changed_by]}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
