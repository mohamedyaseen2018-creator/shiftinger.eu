// Server-only email delivery. Until an email domain / provider key is
// configured, every send is recorded in the email_outbox as "queued" so
// nothing is lost — once RESEND_API_KEY is set, sends go out for real.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { renderEmailTemplate, APP_URL } from "@/lib/emailRender";

export interface DeliverResult {
  sent: boolean;
  /** true when an email provider is configured (failures are real failures) */
  configured: boolean;
  error?: string;
}

/** Low-level send. Gracefully no-ops when no provider is configured yet. */
export async function deliverEmail(to: string, subject: string, body: string): Promise<DeliverResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, configured: false, error: "Email sending not configured yet" };
  }
  const from = process.env.EMAIL_FROM ?? "Shiftinger <noreply@shiftinger.app>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text: body }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { sent: false, configured: true, error: `Email API ${res.status}: ${detail.slice(0, 300)}` };
    }
    return { sent: true, configured: true };
  } catch (err) {
    return { sent: false, configured: true, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}

interface TemplatedSendOptions {
  templateKey: string | null;
  recipientId: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  body: string;
  triggeredBy: "admin" | "system";
}

/** Render placeholders, attempt delivery, and always log to the outbox. */
export async function sendTemplatedEmail(opts: TemplatedSendOptions): Promise<DeliverResult> {
  const vars = {
    name: opts.recipientName || "there",
    email: opts.recipientEmail,
    app_url: APP_URL,
  };
  const subject = renderEmailTemplate(opts.subject, vars);
  const body = renderEmailTemplate(opts.body, vars);

  const result = await deliverEmail(opts.recipientEmail, subject, body);

  await supabaseAdmin.from("email_outbox").insert({
    template_key: opts.templateKey,
    recipient_id: opts.recipientId,
    recipient_email: opts.recipientEmail,
    subject,
    body,
    status: result.sent ? "sent" : result.configured ? "failed" : "queued",
    error: result.sent ? null : (result.error ?? null),
    triggered_by: opts.triggeredBy,
  });

  return result;
}

/** Fired automatically when an admin approves a worker or business. */
export async function sendApprovalEmail(userId: string, accountType: "worker" | "business"): Promise<void> {
  const key = accountType === "worker" ? "worker_approved" : "business_approved";
  const [{ data: tpl }, { data: prof }] = await Promise.all([
    supabaseAdmin.from("email_templates").select("*").eq("template_key", key).maybeSingle(),
    supabaseAdmin.from("profiles").select("id, email, full_name").eq("id", userId).maybeSingle(),
  ]);
  if (!tpl || !tpl.enabled || !prof?.email) return;

  await sendTemplatedEmail({
    templateKey: key,
    recipientId: prof.id,
    recipientEmail: prof.email,
    recipientName: prof.full_name,
    subject: tpl.subject,
    body: tpl.body,
    triggeredBy: "system",
  });
}
