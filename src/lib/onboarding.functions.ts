import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  accountType: z.enum(["worker", "business"]),
});

/**
 * Switch the account type for a brand-new (incomplete) profile.
 *
 * This fixes the case where a user picked "business" (or "worker") but ended
 * up with the wrong account type — most commonly after a Google sign-up, where
 * the selected role can't be passed through the OAuth flow and the database
 * trigger defaults everyone to "worker".
 *
 * Only works while the profile is still "incomplete" so it can never be used to
 * flip a live, reviewed account.
 */
export const setAccountType = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => schema.parse(data))
  .handler(async ({ data, context }) => {
    const userId = context.userId;

    // Read the caller's own profile (RLS-scoped).
    const { data: profile, error: pErr } = await context.supabase
      .from("profiles")
      .select("account_type, status, full_name")
      .eq("id", userId)
      .single();
    if (pErr || !profile) throw new Error("Profile not found");

    // Never allow switching once the profile has left the incomplete state.
    if (profile.status !== "incomplete") {
      throw new Error("Account type can only be changed before your profile is submitted.");
    }

    // Already correct — nothing to do.
    if (profile.account_type === data.accountType) {
      return { ok: true, accountType: data.accountType };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const desired = data.accountType;

    // Update the profile's account type.
    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .update({ account_type: desired })
      .eq("id", userId);
    if (upErr) throw new Error("Could not update account type.");

    if (desired === "business") {
      // Create the business side, remove the (empty) worker side.
      await supabaseAdmin
        .from("business_profiles")
        .upsert(
          { user_id: userId, business_name: profile.full_name },
          { onConflict: "user_id" },
        );
      await supabaseAdmin.from("worker_profiles").delete().eq("user_id", userId);
      await supabaseAdmin.rpc("noop").catch(() => {});
      await supabaseAdmin
        .from("registration_counters")
        .update({
          worker_count: await decr(supabaseAdmin, "worker_count"),
          business_count: await incr(supabaseAdmin, "business_count"),
        })
        .eq("id", 1);
    } else {
      // Create the worker side, remove the (empty) business side.
      await supabaseAdmin
        .from("worker_profiles")
        .upsert({ user_id: userId, name: profile.full_name }, { onConflict: "user_id" });
      await supabaseAdmin.from("business_profiles").delete().eq("user_id", userId);
      await supabaseAdmin
        .from("registration_counters")
        .update({
          business_count: await decr(supabaseAdmin, "business_count"),
          worker_count: await incr(supabaseAdmin, "worker_count"),
        })
        .eq("id", 1);
    }

    return { ok: true, accountType: desired };
  });

// Helpers read the current counter then return the adjusted value. They are
// only ever called for a single in-flight switch, so a small race is harmless
// and the values are display-only.
async function decr(client: typeof import("@/integrations/supabase/client.server").supabaseAdmin, col: "worker_count" | "business_count") {
  const { data } = await client.from("registration_counters").select(col).eq("id", 1).single();
  const current = (data?.[col] as number | undefined) ?? 0;
  return Math.max(0, current - 1);
}

async function incr(client: typeof import("@/integrations/supabase/client.server").supabaseAdmin, col: "worker_count" | "business_count") {
  const { data } = await client.from("registration_counters").select(col).eq("id", 1).single();
  const current = (data?.[col] as number | undefined) ?? 0;
  return current + 1;
}
