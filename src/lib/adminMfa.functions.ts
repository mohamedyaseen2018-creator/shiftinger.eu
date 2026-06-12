// ============================================================================
// Admin two-factor (email code) verification.
//
// After an admin authenticates with their password / Google account, they must
// confirm a 6-digit code sent to their email before the console unlocks. The
// code and the "verified" flag live in an encrypted, http-only session cookie
// (TanStack useSession) — no database table required.
// ============================================================================
import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, randomInt } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CODE_TTL_MS = 10 * 60 * 1000; // code valid for 10 minutes
const VERIFIED_TTL_MS = 8 * 60 * 60 * 1000; // re-verify every 8 hours
const MAX_ATTEMPTS = 5;

interface AdminMfaSession {
  challengeUserId?: string;
  codeHash?: string;
  codeExpires?: number;
  attempts?: number;
  verifiedUserId?: string;
  verifiedAt?: number;
}

function sessionConfig() {
  const password = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!password || password.length < 32) {
    throw new Error("Server session secret is not configured.");
  }
  return {
    password,
    name: "shiftinger-admin-mfa",
    maxAge: 60 * 60 * 24, // cookie lifetime: 24h
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: true,
      path: "/",
    },
  };
}

function hashCode(code: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any): Promise<void> {
  const { supabase, userId } = context;
  const { data: isAdmin, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("Could not verify permissions.");
  if (!isAdmin) throw new Error("Not authorised. Admin access required.");
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return "your email";
  const visible = name.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(name.length - 2, 1))}@${domain}`;
}

/** Whether the current admin has already passed email verification recently. */
export const getAdminMfaStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const session = await useSession<AdminMfaSession>(sessionConfig());
    const d = session.data;
    const verified =
      d.verifiedUserId === context.userId &&
      typeof d.verifiedAt === "number" &&
      Date.now() - d.verifiedAt < VERIFIED_TTL_MS;
    return { verified };
  });

/** Generate a fresh code, stash its hash in the session, and email it. */
export const requestAdminLoginCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const email = (context.claims?.email as string | undefined) ?? "";
    if (!email) throw new Error("No email on file for this admin account.");

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");

    const session = await useSession<AdminMfaSession>(sessionConfig());
    await session.update({
      ...session.data,
      challengeUserId: context.userId,
      codeHash: hashCode(code),
      codeExpires: Date.now() + CODE_TTL_MS,
      attempts: 0,
      // invalidate any previous verification while a new challenge is pending
      verifiedUserId: undefined,
      verifiedAt: undefined,
    });

    const { deliverEmail } = await import("@/lib/email.server");
    const result = await deliverEmail(
      email,
      "Your Shiftinger admin verification code",
      `Your admin verification code is ${code}\n\nIt expires in 10 minutes. If you did not try to sign in to the Shiftinger admin console, please secure your account immediately.`,
    );

    return { emailConfigured: result.configured, sent: result.sent, email: maskEmail(email) };
  });

/** Validate the code the admin typed. On success, mark the session verified. */
export const verifyAdminLoginCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const session = await useSession<AdminMfaSession>(sessionConfig());
    const s = session.data;

    if (
      s.challengeUserId !== context.userId ||
      !s.codeHash ||
      !s.codeExpires ||
      Date.now() > s.codeExpires
    ) {
      throw new Error("Your code has expired. Request a new one.");
    }

    if ((s.attempts ?? 0) >= MAX_ATTEMPTS) {
      await session.update({ ...s, codeHash: undefined, codeExpires: undefined });
      throw new Error("Too many attempts. Request a new code.");
    }

    if (hashCode(data.code) !== s.codeHash) {
      await session.update({ ...s, attempts: (s.attempts ?? 0) + 1 });
      throw new Error("Incorrect code. Please try again.");
    }

    await session.update({
      verifiedUserId: context.userId,
      verifiedAt: Date.now(),
      challengeUserId: undefined,
      codeHash: undefined,
      codeExpires: undefined,
      attempts: 0,
    });

    return { ok: true };
  });

/** Drop the verification flag (called on sign out). */
export const clearAdminMfa = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminMfaSession>(sessionConfig());
  await session.clear();
  return { ok: true };
});
