import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, Store, Mail, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SiteLayout from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { signInSchema, signUpSchema } from "@/lib/validation";
import type { AccountType } from "@/data/types";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as string) === "signup" ? "signup" : "signin",
    role: (search.role as string) === "business" ? "business" : "worker",
  }),
  head: () => ({
    meta: [
      { title: "Sign in or join — Shiftinger" },
      { name: "description", content: "Sign in to Shiftinger or create a free worker or business account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, role } = Route.useSearch();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<"signin" | "signup">(mode);
  const [accountType, setAccountType] = useState<AccountType>(role);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Redirect already-authenticated users onward based on profile status.
  useEffect(() => {
    if (authLoading || !user) return;
    if (!profile) return;
    if (profile.status === "incomplete") navigate({ to: "/onboarding" });
    else navigate({ to: "/dashboard" });
  }, [authLoading, user, profile, navigate]);

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed. Please try again.");
        setBusy(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/onboarding" });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("Email not confirmed")
          ? "Please confirm your email first — check your inbox."
          : "Invalid email or password.",
      );
      return;
    }
    toast.success("Welcome back!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ email, password, fullName, accountType });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        data: {
          full_name: parsed.data.fullName,
          account_type: parsed.data.accountType,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "This email is already registered. Try signing in."
          : error.message,
      );
      return;
    }
    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <SiteLayout>
        <section className="px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-10 text-center ring-1 ring-ink/5">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal/10 text-teal">
              <Mail size={26} />
            </div>
            <h1 className="mt-6 font-serif text-2xl text-ink">Confirm your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              We sent a confirmation link to <strong className="text-ink">{email}</strong>.
              Click it to verify your account, then you'll complete your profile.
            </p>
            <button
              onClick={() => setTab("signin")}
              className="mt-6 text-sm font-medium text-teal hover:underline"
            >
              Back to sign in
            </button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-md">
          <div className="text-center">
            <Link to="/" className="text-2xl font-medium tracking-tight">
              <span className="text-teal">Shift</span>
              <span className="font-serif italic text-gold">inger</span>
            </Link>
            <h1 className="mt-6 font-serif text-3xl text-ink">
              {tab === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-ink/60">
              {tab === "signin"
                ? "Sign in to manage your shifts and profile."
                : "Free to join. One email registers as a worker or a business — not both."}
            </p>
          </div>

          <div className="mt-8 rounded-2xl bg-white p-8 ring-1 ring-ink/5">
            {tab === "signup" && (
              <div className="mb-6">
                <p className="mb-2 text-sm font-medium text-ink">I want to…</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("worker")}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-4 text-center ring-1 transition-colors ${
                      accountType === "worker"
                        ? "bg-teal/5 ring-teal"
                        : "ring-ink/10 hover:bg-ink/5"
                    }`}
                  >
                    <Briefcase size={20} className="text-teal" />
                    <span className="text-sm font-medium text-ink">Find work</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("business")}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-4 text-center ring-1 transition-colors ${
                      accountType === "business"
                        ? "bg-gold/5 ring-gold"
                        : "ring-ink/10 hover:bg-ink/5"
                    }`}
                  >
                    <Store size={20} className="text-gold-dark" />
                    <span className="text-sm font-medium text-ink">Hire staff</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full ring-1 ring-ink/15 transition-colors hover:bg-ink/5 disabled:opacity-50"
            >
              <GoogleIcon />
              <span className="text-sm font-medium text-ink">Continue with Google</span>
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-ink/40">
              <span className="h-px flex-1 bg-ink/10" />
              or
              <span className="h-px flex-1 bg-ink/10" />
            </div>

            <form className="space-y-4" onSubmit={tab === "signin" ? handleSignIn : handleSignUp}>
              {tab === "signup" && (
                <Field label="Full name">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Maria Silva"
                    className={inputClass}
                  />
                </Field>
              )}
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputClass}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </Field>
              <button
                type="submit"
                disabled={busy}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-teal text-sm font-medium text-canvas transition-colors hover:bg-teal-light disabled:opacity-50"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                {tab === "signin" ? "Sign in" : "Create account"}
                {!busy && tab === "signup" && <ArrowRight size={16} />}
              </button>
            </form>

            {tab === "signup" && (
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink/50">
                <ShieldCheck size={13} className="text-teal" />
                {accountType === "worker"
                  ? "First 500 workers join free"
                  : "First 100 businesses join free"}
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-ink/50">
            {tab === "signin" ? (
              <>
                New to Shiftinger?{" "}
                <button onClick={() => setTab("signup")} className="font-medium text-teal hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setTab("signin")} className="font-medium text-teal hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}

const inputClass =
  "w-full rounded-md border-0 bg-canvas px-3 py-2.5 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-2 focus:ring-teal";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
