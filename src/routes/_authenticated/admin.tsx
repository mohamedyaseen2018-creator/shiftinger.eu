import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Loader2, ArrowLeft, Check, X, Briefcase, Store } from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Shiftinger" }] }),
  component: AdminPage,
});

interface PendingProfile {
  id: string;
  email: string;
  account_type: "worker" | "business";
  full_name: string | null;
  status: string;
  created_at: string;
}

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingProfile[]>([]);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "pending_review")
      .order("created_at", { ascending: true });
    setPending((data ?? []) as PendingProfile[]);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate({ to: "/dashboard" });
      return;
    }
    if (isAdmin) load();
  }, [loading, isAdmin, navigate, load]);

  const decide = async (p: PendingProfile, approve: boolean) => {
    const newStatus = approve ? "approved" : "rejected";
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", p.id);
    if (error) {
      toast.error("Could not update.");
      return;
    }
    if (approve) {
      const table = p.account_type === "worker" ? "worker_profiles" : "business_profiles";
      await supabase.from(table).update({ verified: true }).eq("user_id", p.id);
    }
    toast.success(approve ? "Account approved." : "Account rejected.");
    setPending((prev) => prev.filter((x) => x.id !== p.id));
  };

  // While auth resolves, or for non-admins (who are being redirected away),
  // never render the admin content — this prevents any flash of the panel.
  if (loading || !isAdmin || busy) {
    return <SiteLayout><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-teal" /></div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <section className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-teal">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <h1 className="font-serif text-3xl text-ink">Pending approvals</h1>
          <p className="mt-1 text-sm text-ink/60">{pending.length} account{pending.length !== 1 ? "s" : ""} awaiting review.</p>

          <div className="mt-8 space-y-3">
            {pending.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center text-ink/50 ring-1 ring-ink/5">
                Nothing to review right now.
              </div>
            ) : (
              pending.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-ink/5">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${p.account_type === "worker" ? "bg-teal/10 text-teal" : "bg-gold/10 text-gold-dark"}`}>
                      {p.account_type === "worker" ? <Briefcase size={18} /> : <Store size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-ink">{p.full_name || "Unnamed"}</p>
                      <p className="text-xs text-ink/50">{p.email} · {p.account_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => decide(p, true)} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 text-sm font-medium text-canvas hover:bg-teal-light">
                      <Check size={15} /> Approve
                    </button>
                    <button onClick={() => decide(p, false)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-red-600 ring-1 ring-red-200 hover:bg-red-50">
                      <X size={15} /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
