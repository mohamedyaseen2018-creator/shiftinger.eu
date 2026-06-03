import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STATUS = ["incomplete", "pending_review", "approved", "rejected", "blocked"] as const;

/**
 * Confirm the caller is an admin. Throws if not. Returns the admin's email
 * (from the verified JWT claims) so callers can attribute audit entries.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any): Promise<string | null> {
  const { supabase, userId, claims } = context;
  const { data: isAdmin, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("Could not verify permissions.");
  if (!isAdmin) throw new Error("Not authorised. Admin access required.");
  return (claims?.email as string | undefined) ?? null;
}

/**
 * Change a user's review status (approve / reject / pending / block).
 * Admin-only. The update runs with the admin's own session so the
 * status-history trigger records the admin as the actor, then the action is
 * written to the admin audit log.
 */
export const adminSetUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        status: z.enum(STATUS),
        accountType: z.enum(["worker", "business"]),
        targetLabel: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const adminEmail = await assertAdmin(context);
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("profiles")
      .update({ status: data.status })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    const verified = data.status === "approved";
    const table = data.accountType === "worker" ? "worker_profiles" : "business_profiles";
    await supabase.from(table).update({ verified }).eq("user_id", data.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: userId,
      admin_email: adminEmail,
      action: `status:${data.status}`,
      target_type: data.accountType,
      target_id: data.userId,
      target_label: data.targetLabel ?? null,
      details: { status: data.status, verified },
    });

    return { ok: true };
  });

/**
 * Permanently delete a user (auth account + all owned rows via cascade).
 * Admin-only. Logs the action to the audit log before removal.
 */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        targetLabel: z.string().max(200).optional(),
        accountType: z.enum(["worker", "business"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const adminEmail = await assertAdmin(context);
    const { userId } = context;

    if (data.userId === userId) throw new Error("You cannot delete your own admin account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Record the action before the rows disappear.
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: userId,
      admin_email: adminEmail,
      action: "delete",
      target_type: data.accountType ?? "user",
      target_id: data.userId,
      target_label: data.targetLabel ?? null,
      details: {},
    });

    // Remove dependent rows that have no FK cascade to auth.users.
    await supabaseAdmin.from("applications").delete().or(`worker_id.eq.${data.userId},owner_id.eq.${data.userId}`);
    await supabaseAdmin.from("jobs").delete().eq("owner_id", data.userId);
    await supabaseAdmin.from("conversations").delete().or(`worker_id.eq.${data.userId},business_id.eq.${data.userId}`);
    await supabaseAdmin.from("worker_profiles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("business_profiles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("business_locations").delete().eq("business_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (delErr) throw new Error(delErr.message);

    return { ok: true };
  });
