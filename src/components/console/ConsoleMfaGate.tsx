import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Loader2, Mail, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminMfaStatus,
  requestAdminLoginCode,
  verifyAdminLoginCode,
  clearAdminMfa,
} from "@/lib/adminMfa.functions";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import Logo from "@/components/brand/Logo";

type Phase = "checking" | "request" | "awaiting" | "verified";

export function ConsoleMfaGate({ children }: { children: ReactNode }) {
  const checkStatus = useServerFn(getAdminMfaStatus);
  const requestCode = useServerFn(requestAdminLoginCode);
  const verifyCode = useServerFn(verifyAdminLoginCode);
  const clearMfa = useServerFn(clearAdminMfa);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("checking");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  useEffect(() => {
    checkStatus()
      .then((res) => setPhase(res.verified ? "verified" : "request"))
      .catch(() => setPhase("request"));
  }, [checkStatus]);

  const handleSend = async () => {
    setBusy(true);
    try {
      const res = await requestCode();
      setMaskedEmail(res.email);
      setPhase("awaiting");
      if (res.sent) toast.success(`Verification code sent to ${res.email}`);
      else if (!res.emailConfigured)
        toast.error("Email delivery is not configured yet — the code could not be sent.");
      else toast.error("We couldn't send the code. Please try again.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await verifyCode({ data: { code } });
      toast.success("Verified — welcome back.");
      setPhase("verified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await clearMfa().catch(() => {});
    await signOut();
    navigate({ to: "/" });
  };

  if (phase === "verified") return <>{children}</>;

  return (
    <div className="grid min-h-screen place-items-center bg-pine-dark px-6 py-12 text-white">
      <div className="w-full max-w-sm rounded-2xl bg-white/5 p-8 text-center ring-1 ring-white/10 backdrop-blur">
        <div className="flex justify-center">
          <Logo variant="full" theme="dark" size={40} />
        </div>

        {phase === "checking" ? (
          <div className="mt-10 flex items-center justify-center gap-2 text-white/70">
            <Loader2 size={18} className="animate-spin" /> Checking session…
          </div>
        ) : phase === "request" ? (
          <>
            <div className="mx-auto mt-6 flex size-12 items-center justify-center rounded-full bg-amber/20 text-amber">
              <ShieldCheck size={24} />
            </div>
            <h1 className="mt-5 font-serif text-2xl">Admin verification</h1>
            <p className="mt-2 text-sm text-white/65">
              For extra security, we'll email a one-time code to confirm it's you before opening the
              console.
            </p>
            <button
              onClick={handleSend}
              disabled={busy}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-amber text-sm font-semibold text-pine-dark transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Send verification code
            </button>
          </>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="mx-auto mt-6 flex size-12 items-center justify-center rounded-full bg-amber/20 text-amber">
              <Mail size={24} />
            </div>
            <h1 className="mt-5 font-serif text-2xl">Enter your code</h1>
            <p className="mt-2 text-sm text-white/65">
              We sent a 6-digit code to <strong className="text-white">{maskedEmail}</strong>. It
              expires in 10 minutes.
            </p>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="mt-6 w-full rounded-xl bg-white/10 px-4 py-3 text-center text-2xl tracking-[0.4em] text-white ring-1 ring-white/15 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber"
            />
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-amber text-sm font-semibold text-pine-dark transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              Verify & continue
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={busy}
              className="mt-3 text-xs text-white/60 hover:text-white hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          </form>
        )}

        <button
          onClick={handleSignOut}
          className="mx-auto mt-8 flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white"
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );
}
