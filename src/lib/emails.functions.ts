import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

/** Templates + outbox history + user list for the admin Emails panel. */
export const getEmailAdminData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: templates }, { data: outbox }, { data: users }] = await Promise.all([
      supabaseAdmin.from("email_templates").select("*").order("name"),
      supabaseAdmin
        .from("email_outbox")
        .select("id, template_key, recipient_email, subject, status, error, triggered_by, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, account_type, status")
        .order("email"),
    ]);

    return {
      templates: templates ?? [],
      outbox: outbox ?? [],
      users: users ?? [],
      emailConfigured: Boolean(process.env.RESEND_API_KEY),
    };
  });

/** Update a template's subject, body, or enabled flag. Admin-only. */
export const saveEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        subject: z.string().min(1).max(300),
        body: z.string().min(1).max(10000),
        enabled: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("email_templates")
      .update({ subject: data.subject, body: data.body, enabled: data.enabled })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Send an email to all users, all workers, all businesses, or one user. */
export const sendAdminEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        templateKey: z.string().max(100).nullable().optional(),
        subject: z.string().min(1).max(300),
        body: z.string().min(1).max(10000),
        audience: z.enum(["all", "workers", "businesses", "user"]),
        userId: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTemplatedEmail } = await import("@/lib/email.server");

    let query = supabaseAdmin.from("profiles").select("id, email, full_name, account_type").limit(500);
    if (data.audience === "workers") query = query.eq("account_type", "worker");
    if (data.audience === "businesses") query = query.eq("account_type", "business");
    if (data.audience === "user") {
      if (!data.userId) throw new Error("Select a user to send to.");
      query = query.eq("id", data.userId);
    }
    const { data: recipients, error } = await query;
    if (error) throw new Error(error.message);
    if (!recipients || recipients.length === 0) throw new Error("No matching recipients found.");

    let sent = 0;
    let queued = 0;
    let failed = 0;
    for (const r of recipients) {
      if (!r.email) continue;
      const res = await sendTemplatedEmail({
        templateKey: data.templateKey ?? null,
        recipientId: r.id,
        recipientEmail: r.email,
        recipientName: r.full_name,
        subject: data.subject,
        body: data.body,
        triggeredBy: "admin",
      });
      if (res.sent) sent += 1;
      else if (!res.configured) queued += 1;
      else failed += 1;
    }

    return { total: recipients.length, sent, queued, failed };
  });
