// ============================================================================
// Admin console server functions — read & mutate REAL platform data.
//
// Every function is admin-gated: requireSupabaseAuth validates the bearer token
// and assertAdmin() confirms the caller holds the `admin` role. Reads/writes use
// the service-role client (RLS bypassed) only AFTER the admin check passes.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROFILE_STATUS = [
  "incomplete",
  "pending_review",
  "approved",
  "rejected",
  "blocked",
] as const;
const JOB_STATUS = ["open", "closed", "filled"] as const;
const APPLICATION_STATUS = [
  "applied",
  "matched",
  "rejected",
  "confirmed",
  "working",
  "completed",
  "cancelled",
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any): Promise<{ userId: string; email: string | null }> {
  const { supabase, userId, claims } = context;
  const { data: isAdmin, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("Could not verify permissions.");
  if (!isAdmin) throw new Error("Not authorised. Admin access required.");
  return { userId, email: (claims?.email as string | undefined) ?? null };
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function maskInitials(name: string): string {
  const initials = name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").join(".");
  return initials ? `${initials}.***` : "—";
}

export type ConsoleStatus = (typeof PROFILE_STATUS)[number];

// ── READ: full console snapshot ──────────────────────────────────────────────
export const getConsoleData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [profilesR, workersR, wContactsR, wDocsR, businessesR, bContactsR, jobsR, appsR, rolesR, auditR] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*"),
        supabaseAdmin.from("worker_profiles").select("*"),
        supabaseAdmin.from("worker_contacts").select("user_id, phone"),
        supabaseAdmin.from("worker_documents").select("user_id, id_document_url"),
        supabaseAdmin.from("business_profiles").select("*"),
        supabaseAdmin.from("business_contacts").select("*"),
        supabaseAdmin.from("jobs").select("*"),
        supabaseAdmin.from("applications").select("*"),
        supabaseAdmin.from("user_roles").select("user_id, role"),
        supabaseAdmin.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(40),
      ]);

    const profiles = profilesR.data ?? [];
    const profileById = new Map(profiles.map((p) => [p.id, p]));
    const phoneByUser = new Map((wContactsR.data ?? []).map((c) => [c.user_id, c.phone]));
    const docByUser = new Map(
      (wDocsR.data ?? []).map((d) => [d.user_id, d.id_document_url as string | null]),
    );
    const bContactByUser = new Map((bContactsR.data ?? []).map((c) => [c.user_id, c]));
    const businessByOwner = new Map((businessesR.data ?? []).map((b) => [b.user_id, b]));
    const workerByUser = new Map((workersR.data ?? []).map((w) => [w.user_id, w]));
    const jobs = jobsR.data ?? [];
    const jobById = new Map(jobs.map((j) => [j.id, j]));

    const appCountByJob = new Map<string, number>();
    (appsR.data ?? []).forEach((a) =>
      appCountByJob.set(a.job_id, (appCountByJob.get(a.job_id) ?? 0) + 1),
    );

    const workers = (workersR.data ?? []).map((w) => {
      const p = profileById.get(w.user_id);
      return {
        id: w.user_id,
        name: w.name ?? p?.full_name ?? "—",
        email: p?.email ?? "",
        phone: phoneByUser.get(w.user_id) ?? "",
        nationality: w.nationality ?? "",
        city: w.city ?? "",
        residence: w.residence ?? "",
        mainRole: w.main_role ?? "",
        mainRoleYears: w.main_role_years ?? 0,
        subRoles: arr(w.sub_roles),
        languages: arr(w.languages),
        atividade: !!w.atividade,
        minRate: Number(w.min_rate ?? 0),
        rating: Number(w.rating ?? 0),
        ratingCount: w.rating_count ?? 0,
        shiftsCompleted: w.shifts_completed ?? 0,
        verified: !!w.verified,
        status: (p?.status ?? "incomplete") as ConsoleStatus,
        portfolioUrl: w.portfolio_url ?? "",
        bio: w.bio ?? "",
        adminNotes: w.admin_notes ?? "",
        atividadeNumber: w.atividade_number ?? "",
        hasCv: !!(w.portfolio_url && String(w.portfolio_url).trim()),
        hasDocuments: !!(docByUser.get(w.user_id) ?? "").toString().trim(),
        idDocumentPath: (docByUser.get(w.user_id) ?? "") as string,
      };
    });

    const businesses = (businessesR.data ?? []).map((b) => {
      const p = profileById.get(b.user_id);
      const c = bContactByUser.get(b.user_id);
      return {
        id: b.user_id,
        name: b.business_name ?? p?.full_name ?? "—",
        city: b.city ?? "",
        area: b.area ?? "",
        category: b.category ?? "",
        email: p?.email ?? "",
        contactName: c?.contact_name ?? "",
        contactPhone: c?.phone ?? "",
        contactPosition: c?.contact_position ?? "",
        verified: !!b.verified,
        isEarlyBird: !!b.is_early_bird,
        rating: Number(b.rating ?? 0),
        ratingCount: b.rating_count ?? 0,
        status: (p?.status ?? "incomplete") as ConsoleStatus,
        description: b.description ?? "",
        adminNotes: b.admin_notes ?? "",
        nif: b.nif ?? "",
        subSector: b.sub_sector ?? "",
        displayInitials: b.display_initials || maskInitials(b.business_name ?? ""),
        languagesRequired: arr(b.languages_required),
        preferredRoles: arr(b.preferred_roles),
      };
    });

    const shifts = jobs.map((j) => {
      const b = businessByOwner.get(j.owner_id);
      return {
        id: j.id,
        ownerId: j.owner_id,
        businessName: b?.business_name ?? "—",
        businessVerified: !!b?.verified,
        role: j.role ?? "",
        type: j.type ?? "single",
        date: j.date ?? j.start_date ?? null,
        startTime: j.start_time ?? null,
        endTime: j.end_time ?? null,
        rate: Number(j.rate ?? 0),
        spots: j.spots ?? 0,
        spotsRemaining: j.spots_remaining ?? 0,
        note: j.note ?? "",
        city: b?.city ?? "",
        status: (j.status ?? "open") as (typeof JOB_STATUS)[number],
        applications: appCountByJob.get(j.id) ?? 0,
      };
    });

    const matches = (appsR.data ?? []).map((a) => {
      const w = workerByUser.get(a.worker_id);
      const b = businessByOwner.get(a.owner_id);
      const job = jobById.get(a.job_id);
      return {
        id: a.id,
        workerName: w?.name ?? "—",
        businessName: b?.business_name ?? "—",
        businessVerified: !!b?.verified,
        role: job?.role ?? "",
        date: job?.date ?? null,
        score: a.match_score ?? 0,
        status: (a.status ?? "applied") as (typeof APPLICATION_STATUS)[number],
      };
    });

    const roleByUser = new Map<string, string[]>();
    (rolesR.data ?? []).forEach((r) => {
      const list = roleByUser.get(r.user_id) ?? [];
      list.push(r.role);
      roleByUser.set(r.user_id, list);
    });
    const admins = profiles
      .filter((p) => (roleByUser.get(p.id) ?? []).some((r) => r === "admin" || r === "moderator"))
      .map((p) => ({
        id: p.id,
        email: p.email,
        name: p.full_name ?? p.email,
        accountType: p.account_type as "worker" | "business",
        role: (roleByUser.get(p.id) ?? []).includes("admin") ? "admin" : "moderator",
      }));

    const metrics = {
      workers: workers.length,
      businesses: businesses.length,
      jobs: shifts.length,
      openJobs: shifts.filter((s) => s.status === "open").length,
      applications: matches.length,
      confirmed: matches.filter(
        (m) => m.status === "confirmed" || m.status === "working" || m.status === "completed",
      ).length,
      pendingApprovals: [...workers, ...businesses].filter((x) => x.status === "pending_review").length,
    };

    const audit = (auditR.data ?? []).map((a) => ({
      id: a.id,
      action: a.action,
      targetType: a.target_type,
      targetLabel: a.target_label,
      adminEmail: a.admin_email,
      createdAt: a.created_at,
    }));

    return { workers, businesses, shifts, matches, admins, metrics, audit };
  });

// ── WRITE: status (approve / reject / block) ─────────────────────────────────
export const consoleSetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        status: z.enum(PROFILE_STATUS),
        accountType: z.enum(["worker", "business"]),
        targetLabel: z.string().max(200).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId, email } = await assertAdmin(context);
    const { supabase } = context;

    // Run the status update with the admin's own session so the history trigger
    // records the admin as the actor.
    const { error } = await supabase.from("profiles").update({ status: data.status }).eq("id", data.userId);
    if (error) throw new Error(error.message);

    const verified = data.status === "approved";
    const table = data.accountType === "worker" ? "worker_profiles" : "business_profiles";
    await supabase.from(table).update({ verified }).eq("user_id", data.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: userId,
      admin_email: email,
      action: `status:${data.status}`,
      target_type: data.accountType,
      target_id: data.userId,
      target_label: data.targetLabel ?? null,
      details: { status: data.status, verified },
    });

    // Approval email — best-effort, never blocks the status change.
    if (data.status === "approved") {
      try {
        const { sendApprovalEmail } = await import("@/lib/email.server");
        await sendApprovalEmail(data.userId, data.accountType);
      } catch (err) {
        console.error("Approval email failed:", err);
      }
    }

    return { ok: true };
  });

// ── WRITE: worker profile fields ─────────────────────────────────────────────
export const consoleUpdateWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(120),
        phone: z.string().max(40).optional().default(""),
        nationality: z.string().max(80).optional().default(""),
        city: z.string().max(80).optional().default(""),
        mainRole: z.string().max(80).optional().default(""),
        mainRoleYears: z.number().int().min(0).max(80).optional().default(0),
        subRoles: z.array(z.string().max(60)).max(40).optional().default([]),
        languages: z.array(z.string().max(60)).max(40).optional().default([]),
        atividade: z.boolean().optional().default(false),
        minRate: z.number().min(0).max(1000).optional().default(0),
        rating: z.number().min(0).max(5).optional().default(0),
        portfolioUrl: z.string().max(500).optional().default(""),
        bio: z.string().max(2000).optional().default(""),
        adminNotes: z.string().max(2000).optional().default(""),
        atividadeNumber: z.string().max(80).optional().default(""),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("worker_profiles")
      .update({
        name: data.name,
        nationality: data.nationality,
        city: data.city,
        main_role: data.mainRole,
        main_role_years: data.mainRoleYears,
        sub_roles: data.subRoles,
        languages: data.languages,
        atividade: data.atividade,
        min_rate: data.minRate,
        rating: data.rating,
        portfolio_url: data.portfolioUrl,
        bio: data.bio,
        admin_notes: data.adminNotes,
        atividade_number: data.atividadeNumber,
      })
      .eq("user_id", data.id);
    if (error) throw new Error(error.message);

    if (data.phone) {
      await supabaseAdmin
        .from("worker_contacts")
        .upsert({ user_id: data.id, phone: data.phone }, { onConflict: "user_id" });
    }
    await supabaseAdmin.from("profiles").update({ full_name: data.name }).eq("id", data.id);
    return { ok: true };
  });

// ── WRITE: business profile fields ───────────────────────────────────────────
export const consoleUpdateBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(160),
        city: z.string().max(80).optional().default(""),
        area: z.string().max(120).optional().default(""),
        category: z.string().max(80).optional().default(""),
        description: z.string().max(2000).optional().default(""),
        contactName: z.string().max(120).optional().default(""),
        contactPhone: z.string().max(40).optional().default(""),
        contactPosition: z.string().max(120).optional().default(""),
        rating: z.number().min(0).max(5).optional().default(0),
        isEarlyBird: z.boolean().optional().default(false),
        adminNotes: z.string().max(2000).optional().default(""),
        nif: z.string().max(40).optional().default(""),
        subSector: z.string().max(120).optional().default(""),
        displayInitials: z.string().max(40).optional().default(""),
        languagesRequired: z.array(z.string().max(60)).max(40).optional().default([]),
        preferredRoles: z.array(z.string().max(60)).max(40).optional().default([]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("business_profiles")
      .update({
        business_name: data.name,
        city: data.city,
        area: data.area,
        category: data.category,
        description: data.description,
        rating: data.rating,
        is_early_bird: data.isEarlyBird,
        admin_notes: data.adminNotes,
        nif: data.nif,
        sub_sector: data.subSector,
        display_initials: data.displayInitials,
        languages_required: data.languagesRequired,
        preferred_roles: data.preferredRoles,
      })
      .eq("user_id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("business_contacts").upsert(
      {
        user_id: data.id,
        phone: data.contactPhone,
        contact_name: data.contactName,
        contact_position: data.contactPosition,
      },
      { onConflict: "user_id" },
    );
    await supabaseAdmin.from("profiles").update({ full_name: data.name }).eq("id", data.id);
    return { ok: true };
  });

// ── WRITE: shift (job) fields ────────────────────────────────────────────────
export const consoleUpdateShift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        role: z.string().min(1).max(80),
        rate: z.number().min(0).max(1000),
        spots: z.number().int().min(0).max(500),
        status: z.enum(JOB_STATUS),
        note: z.string().max(1000).optional().default(""),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("jobs")
      .update({ role: data.role, rate: data.rate, spots: data.spots, status: data.status, note: data.note })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── WRITE: match (application) status ─────────────────────────────────────────
export const consoleSetMatchStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(APPLICATION_STATUS) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("applications")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── WRITE: grant / revoke admin role ─────────────────────────────────────────
export const consoleSetAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        email: z.string().email().max(200).optional(),
        userId: z.string().uuid().optional(),
        makeAdmin: z.boolean(),
      })
      .refine((v) => v.email || v.userId, { message: "email or userId required" })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId: adminId, email: adminEmail } = await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let targetId = data.userId ?? null;
    let targetLabel = data.email ?? null;
    if (!targetId && data.email) {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .ilike("email", data.email)
        .maybeSingle();
      if (!prof) throw new Error("No account found with that email.");
      targetId = prof.id;
      targetLabel = prof.email;
    }
    if (!targetId) throw new Error("Target user not found.");

    if (!data.makeAdmin && targetId === adminId) {
      throw new Error("You cannot remove your own admin access.");
    }

    if (data.makeAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: targetId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", targetId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }

    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: adminId,
      admin_email: adminEmail,
      action: data.makeAdmin ? "role:grant_admin" : "role:revoke_admin",
      target_type: "user",
      target_id: targetId,
      target_label: targetLabel,
      details: {},
    });
    return { ok: true };
  });

// ── WRITE: delete a user (auth + owned rows) ─────────────────────────────────
export const consoleDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        targetLabel: z.string().max(200).optional(),
        accountType: z.enum(["worker", "business"]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId: adminId, email: adminEmail } = await assertAdmin(context);
    if (data.userId === adminId) throw new Error("You cannot delete your own admin account.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: adminId,
      admin_email: adminEmail,
      action: "delete",
      target_type: data.accountType ?? "user",
      target_id: data.userId,
      target_label: data.targetLabel ?? null,
      details: {},
    });

    await supabaseAdmin.from("applications").delete().or(`worker_id.eq.${data.userId},owner_id.eq.${data.userId}`);
    await supabaseAdmin.from("jobs").delete().eq("owner_id", data.userId);
    await supabaseAdmin.from("conversations").delete().or(`worker_id.eq.${data.userId},business_id.eq.${data.userId}`);
    await supabaseAdmin.from("worker_contacts").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("worker_documents").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("worker_profiles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("business_contacts").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("business_profiles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("business_locations").delete().eq("business_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (delErr) throw new Error(delErr.message);
    return { ok: true };
  });

// ── READ: signed URL for a worker's uploaded ID document ─────────────────────
export const consoleSignWorkerDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: doc } = await supabaseAdmin
      .from("worker_documents")
      .select("id_document_url")
      .eq("user_id", data.userId)
      .maybeSingle();

    const path = doc?.id_document_url;
    if (!path) return { url: null as string | null };

    const { data: signed, error } = await supabaseAdmin.storage
      .from("worker-docs")
      .createSignedUrl(path, 60 * 10);
    if (error) throw new Error(error.message);
    return { url: signed?.signedUrl ?? null };
  });

// ── WRITE: set a worker's verification flag (document verification) ───────────
export const consoleSetWorkerVerified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        verified: z.boolean(),
        targetLabel: z.string().max(200).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId: adminId, email: adminEmail } = await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("worker_profiles")
      .update({ verified: data.verified })
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: adminId,
      admin_email: adminEmail,
      action: data.verified ? "document:verified" : "document:unverified",
      target_type: "worker",
      target_id: data.userId,
      target_label: data.targetLabel ?? null,
      details: { verified: data.verified },
    });
    return { ok: true };
  });
