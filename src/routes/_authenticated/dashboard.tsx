import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  Clock,
  XCircle,
  Ban,
  CheckCircle,
  Briefcase,
  Store,
  Plus,
  Users,
  MessageSquare,
  UserCog,
  LogOut,
  Star,
  Send,
  Phone,
} from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Shiftinger" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile && profile.status === "incomplete") {
      navigate({ to: "/onboarding" });
    }
  }, [loading, profile, navigate]);

  if (loading || !profile) {
    return (
      <SiteLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-teal" />
        </div>
      </SiteLayout>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <SiteLayout>
      <section className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl text-ink">
                {profile.full_name || (profile.account_type === "worker" ? "Worker" : "Business")}
              </h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-ink/60">
                {profile.account_type === "worker" ? <Briefcase size={14} /> : <Store size={14} />}
                {profile.account_type === "worker" ? "Worker account" : "Business account"}
                <StatusBadge status={profile.status} />
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link to="/admin" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas hover:bg-ink/90">
                  Admin
                </Link>
              )}
              <button onClick={handleSignOut} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 hover:bg-ink/5">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>

          <div className="mt-8">
            {profile.status === "pending_review" && <PendingNote />}
            {profile.status === "rejected" && <RejectedNote />}
            {profile.status === "blocked" && <BlockedNote />}
            {profile.status === "approved" &&
              (profile.account_type === "worker" ? <WorkerHub /> : <BusinessHub />)}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending_review: { label: "Under review", cls: "bg-amber-50 text-amber-700" },
    approved: { label: "Verified", cls: "bg-teal/10 text-teal" },
    rejected: { label: "Not approved", cls: "bg-red-50 text-red-600" },
    blocked: { label: "Blocked", cls: "bg-red-50 text-red-600" },
    incomplete: { label: "Incomplete", cls: "bg-ink/5 text-ink/60" },
  };
  const s = map[status] ?? map.incomplete;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

function EditProfileLink({ label = "Edit profile" }: { label?: string }) {
  return (
    <Link
      to="/profile"
      className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-teal ring-1 ring-teal/20 hover:bg-teal/5"
    >
      <UserCog size={15} /> {label}
    </Link>
  );
}

function PendingNote() {
  return (
    <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-ink/5">
      <Clock className="mx-auto text-amber-500" size={32} />
      <h2 className="mt-4 font-serif text-2xl text-ink">We're reviewing your profile</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
        Thanks for completing your profile. Our team verifies every account to keep Shiftinger
        safe and trusted. You'll receive an email once you're confirmed — usually within 48 hours.
      </p>
      <EditProfileLink label="Update my details" />
    </div>
  );
}

function RejectedNote() {
  return (
    <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-ink/5">
      <XCircle className="mx-auto text-red-500" size={32} />
      <h2 className="mt-4 font-serif text-2xl text-ink">Account not approved</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
        Unfortunately we couldn't verify your account at this time. If you think this is a mistake,
        contact us and we'll take another look.
      </p>
      <EditProfileLink label="Update my details" />
    </div>
  );
}

function BlockedNote() {
  return (
    <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-ink/5">
      <Ban className="mx-auto text-red-500" size={32} />
      <h2 className="mt-4 font-serif text-2xl text-ink">Your account is blocked</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
        You have an unfinished job that wasn't closed with a review. Please complete and review your
        open job to unblock posting and applying again.
      </p>
      <EditProfileLink />
    </div>
  );
}

function HubCard({ to, icon: Icon, title, body }: { to: string; icon: typeof Plus; title: string; body: string }) {
  return (
    <Link to={to} className="flex flex-col rounded-2xl bg-white p-6 ring-1 ring-ink/5 transition-shadow hover:shadow-md">
      <div className="flex size-11 items-center justify-center rounded-xl bg-teal/5 text-teal">
        <Icon size={20} />
      </div>
      <h3 className="mt-4 font-medium text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink/60">{body}</p>
    </Link>
  );
}

function WorkerHub() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-teal/5 px-4 py-3 text-sm text-teal ring-1 ring-teal/10">
        <CheckCircle size={16} /> Your account is verified. Start applying to shifts.
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HubCard to="/jobs" icon={Briefcase} title="Browse shifts" body="Find shifts matching your skills and apply." />
        <HubCard to="/applications" icon={Users} title="My applications" body="Track applied, matched and working shifts." />
        <HubCard to="/messages" icon={MessageSquare} title="Messages" body="Chat with businesses after confirmation." />
        <HubCard to="/profile" icon={UserCog} title="My profile" body="Edit details, availability and rates." />
      </div>
    </div>
  );
}

function BusinessHub() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-teal/5 px-4 py-3 text-sm text-teal ring-1 ring-teal/10">
        <CheckCircle size={16} /> Your account is verified. Post shifts and browse talent.
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HubCard to="/post-job" icon={Plus} title="Post a shift" body="Create a single shift or part-time role." />
        <HubCard to="/my-jobs" icon={Briefcase} title="My shifts" body="Manage jobs and review applicants." />
        <HubCard to="/talent" icon={Users} title="Browse talent" body="Find verified, skill-matched workers." />
        <HubCard to="/messages" icon={MessageSquare} title="Messages" body="Chat with workers after confirmation." />
        <HubCard to="/profile" icon={UserCog} title="Business profile" body="Edit your business details." />
      </div>
    </div>
  );
}
