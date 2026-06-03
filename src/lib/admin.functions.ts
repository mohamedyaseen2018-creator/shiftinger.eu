import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently delete a user (auth account + all owned rows via cascade).
 * Restricted to admins — verified server-side with the has_role function.
 */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify the caller is an admin.
    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (roleErr) throw new Error("Could not verify permissions.");
    if (!isAdmin) throw new Error("Not authorised.");
    if (data.userId === userId) throw new Error("You cannot delete your own admin account.");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

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
