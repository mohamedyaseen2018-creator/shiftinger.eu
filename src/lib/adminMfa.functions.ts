// ============================================================================
// Admin two-factor (access code) verification.
//
// After an admin authenticates with their password / Google account, they must
// confirm a 6-digit access code before the console unlocks. The "verified" flag
// (and the per-session attempt counter used for lockout) live in an encrypted,
// http-only session cookie (TanStack useSession) — no database table required.
//
// The expected code is NOT hardcoded in source. It is read from the private
// server secret ADMIN_MFA_CODE, so it can be rotated without a code change and
// is never exposed to the browser.
// ============================================================================
import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VERIFIED_TTL_MS = 8 * 60 * 60 * 1000; // re-verify every 8 hours
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minute lockout after too many tries

interface AdminMfaSession {
  attempts?: number;
  lockedUntil?: number;
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

function hashCode(code: string): Buffer {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHash("sha256").update(`${salt}:${code}`).digest();
}

/** Constant-time comparison of two codes (via their salted hashes). */
function codesMatch(a: string, b: string): boolean {
  return timingSafeEqual(hashCode(a), hashCode(b));
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

/** Whether the current admin has already passed verification recently. */
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

/** Validate the access code the admin typed. On success, mark the session verified. */
export const verifyAdminLoginCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const expected = process.env.ADMIN_MFA_CODE;
    if (!expected || !/^\d{6}$/.test(expected)) {
      throw new Error(
        "Admin access code is not configured. Set the ADMIN_MFA_CODE secret to a 6-digit code.",
      );
    }

    const session = await useSession<AdminMfaSession>(sessionConfig());
    const d = session.data;

    // Enforce lockout window.
    if (typeof d.lockedUntil === "number" && Date.now() < d.lockedUntil) {
      const mins = Math.ceil((d.lockedUntil - Date.now()) / 60000);
      throw new Error(`Too many incorrect attempts. Try again in ${mins} minute(s).`);
    }

    // Validate the submitted code in constant time.
    if (!codesMatch(data.code, expected)) {
      const attempts = (d.attempts ?? 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await session.update({
          ...d,
          attempts: 0,
          lockedUntil: Date.now() + LOCKOUT_MS,
        });
        throw new Error("Too many incorrect attempts. Please try again later.");
      }
      await session.update({ ...d, attempts });
      throw new Error("Incorrect code. Please try again.");
    }

    await session.update({
      verifiedUserId: context.userId,
      verifiedAt: Date.now(),
      attempts: 0,
      lockedUntil: undefined,
    });

    return { ok: true };
  });

/** Drop the verification flag (called on sign out). */
export const clearAdminMfa = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminMfaSession>(sessionConfig());
  await session.clear();
  return { ok: true };
});
