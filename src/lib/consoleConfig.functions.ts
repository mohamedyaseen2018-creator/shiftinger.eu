// ============================================================================
// Admin console — configuration server functions.
//
// Platform config, daily confirmation window, KPI settings, disputes, and the
// editable platform dropdown lists. Plus manual creation of worker/business
// accounts. Every function is admin-gated.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any): Promise<{ userId: string; email: string | null }> {
  const { supabase, userId, claims } = context;
  const { data: isAdmin, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error("Could not verify permissions.");
  if (!isAdmin) throw new Error("Not authorised. Admin access required.");
  return { userId, email: (claims?.email as string | undefined) ?? null };
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

const FREQUENCY = ["Daily", "Weekly", "Monthly", "Quarterly"] as const;
const KPI_CATEGORY = ["Supply", "Demand", "Liquidity", "Revenue", "Trust & Safety"] as const;
const DISPUTE_STATUS = ["open", "under_review", "resolved", "escalated", "closed"] as const;
const DISPUTE_PRIORITY = ["low", "medium", "high"] as const;
const LIST_KEYS = [
  "nationality",
  "language",
  "skill",
  "sector",
  "sub_sector",
  "city",
  "dispute_issue_type",
  "shift_role",
  "admin_role",
] as const;

// ── READ: full config snapshot ───────────────────────────────────────────────
export const getConsoleConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [cfgR, cwR, kpisR, dispR, listsR, jobsR] = await Promise.all([
      supabaseAdmin.from("platform_config").select("*").eq("id", 1).maybeSingle(),
      supabaseAdmin.from("confirmation_window").select("*").eq("id", 1).maybeSingle(),
      supabaseAdmin.from("kpi_settings").select("*").order("sort_order", { ascending: true }),
      supabaseAdmin.from("disputes").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("platform_lists").select("*").order("sort_order", { ascending: true }),
      supabaseAdmin.from("job_catalog").select("*").order("sort_order", { ascending: true }),
    ]);

    const c = cfgR.data;
    const w = cwR.data;

    return {
      config: {
        platformName: c?.platform_name ?? "Shiftinger",
        description: c?.description ?? "",
        currency: c?.currency ?? "EUR",
        timezone: c?.timezone ?? "Europe/Lisbon",
        cities: arr(c?.cities),
        sectors: arr(c?.sectors),
      },
      confirmationWindow: {
        startTime: (w?.start_time ?? "09:00:00").slice(0, 5),
        endTime: (w?.end_time ?? "18:00:00").slice(0, 5),
        timezone: w?.timezone ?? "Europe/Lisbon",
        autoExpiry: !!(w?.auto_expiry ?? true),
        reminder30min: !!(w?.reminder_30min ?? true),
      },
      kpis: (kpisR.data ?? []).map((k) => ({
        id: k.id,
        name: k.name,
        formula: k.formula ?? "",
        target: Number(k.target ?? 0),
        unit: k.unit ?? "",
        frequency: k.frequency ?? "Monthly",
        category: k.category ?? "Supply",
        enabled: !!k.enabled,
        isCustom: !!k.is_custom,
        sortOrder: k.sort_order ?? 0,
      })),
      disputes: (dispR.data ?? []).map((d) => ({
        id: d.id,
        title: d.title,
        workerLabel: d.worker_label ?? "",
        businessLabel: d.business_label ?? "",
        issueType: d.issue_type ?? "",
        status: d.status ?? "open",
        priority: d.priority ?? "medium",
        assignedAdminId: d.assigned_admin_id ?? null,
        assignedAdminLabel: d.assigned_admin_label ?? "",
        deadline: d.deadline ?? null,
        internalNotes: d.internal_notes ?? "",
        resolutionSummary: d.resolution_summary ?? "",
        createdAt: d.created_at,
      })),
      lists: (listsR.data ?? []).map((l) => ({
        id: l.id,
        listKey: l.list_key,
        value: l.value,
        active: !!l.active,
        sortOrder: l.sort_order ?? 0,
      })),
    };
  });

// ── WRITE: platform config ───────────────────────────────────────────────────
export const consoleSaveConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        platformName: z.string().min(1).max(120),
        description: z.string().max(2000).optional().default(""),
        currency: z.string().min(1).max(10),
        timezone: z.string().min(1).max(60),
        cities: z.array(z.string().max(80)).max(200).optional().default([]),
        sectors: z.array(z.string().max(80)).max(200).optional().default([]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("platform_config").upsert(
      {
        id: 1,
        platform_name: data.platformName,
        description: data.description,
        currency: data.currency,
        timezone: data.timezone,
        cities: data.cities,
        sectors: data.sectors,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── WRITE: confirmation window ───────────────────────────────────────────────
export const consoleSaveConfirmationWindow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        autoExpiry: z.boolean(),
        reminder30min: z.boolean(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("confirmation_window").upsert(
      {
        id: 1,
        start_time: data.startTime,
        end_time: data.endTime,
        timezone: "Europe/Lisbon",
        auto_expiry: data.autoExpiry,
        reminder_30min: data.reminder30min,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── WRITE: KPI upsert (create or edit) ───────────────────────────────────────
export const consoleUpsertKpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(160),
        formula: z.string().max(500).optional().default(""),
        target: z.number().min(0).max(1_000_000_000),
        unit: z.string().max(20).optional().default(""),
        frequency: z.enum(FREQUENCY),
        category: z.enum(KPI_CATEGORY),
        enabled: z.boolean().optional().default(true),
        sortOrder: z.number().int().min(0).max(9999).optional().default(0),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      name: data.name,
      formula: data.formula,
      target: data.target,
      unit: data.unit,
      frequency: data.frequency,
      category: data.category,
      enabled: data.enabled,
      sort_order: data.sortOrder,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("kpi_settings").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("kpi_settings").insert({ ...row, is_custom: true });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const consoleDeleteKpi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("kpi_settings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── WRITE: dispute upsert ────────────────────────────────────────────────────
export const consoleUpsertDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().min(1).max(200),
        workerLabel: z.string().max(120).optional().default(""),
        businessLabel: z.string().max(120).optional().default(""),
        issueType: z.string().max(120).optional().default(""),
        status: z.enum(DISPUTE_STATUS),
        priority: z.enum(DISPUTE_PRIORITY),
        assignedAdminId: z.string().uuid().nullable().optional(),
        assignedAdminLabel: z.string().max(160).optional().default(""),
        deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        internalNotes: z.string().max(4000).optional().default(""),
        resolutionSummary: z.string().max(4000).optional().default(""),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      title: data.title,
      worker_label: data.workerLabel,
      business_label: data.businessLabel,
      issue_type: data.issueType,
      status: data.status,
      priority: data.priority,
      assigned_admin_id: data.assignedAdminId ?? null,
      assigned_admin_label: data.assignedAdminLabel,
      deadline: data.deadline ?? null,
      internal_notes: data.internalNotes,
      resolution_summary: data.resolutionSummary,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("disputes").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("disputes").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const consoleDeleteDispute = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("disputes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── WRITE: platform list option upsert ───────────────────────────────────────
export const consoleUpsertListOption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        listKey: z.enum(LIST_KEYS),
        value: z.string().min(1).max(120),
        active: z.boolean().optional().default(true),
        sortOrder: z.number().int().min(0).max(9999).optional().default(0),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("platform_lists")
        .update({ value: data.value, active: data.active, sort_order: data.sortOrder })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("platform_lists").insert({
        list_key: data.listKey,
        value: data.value,
        active: data.active,
        sort_order: data.sortOrder,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const consoleDeleteListOption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("platform_lists").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── WRITE: create worker account manually ────────────────────────────────────
export const consoleCreateWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        name: z.string().min(1).max(120),
        email: z.string().email().max(200),
        phone: z.string().max(40).optional().default(""),
        nationality: z.string().max(80).optional().default(""),
        city: z.string().max(80).optional().default(""),
        mainRole: z.string().max(80).optional().default(""),
        subRoles: z.array(z.string().max(60)).max(40).optional().default([]),
        languages: z.array(z.string().max(60)).max(40).optional().default([]),
        atividade: z.boolean().optional().default(false),
        atividadeNumber: z.string().max(80).optional().default(""),
        adminNotes: z.string().max(2000).optional().default(""),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId: adminId, email: adminEmail } = await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      password: crypto.randomUUID() + "Aa1!",
      user_metadata: { full_name: data.name, account_type: "worker" },
    });
    if (cErr || !created.user) throw new Error(cErr?.message ?? "Could not create worker.");
    const uid = created.user.id;

    await supabaseAdmin
      .from("worker_profiles")
      .update({
        name: data.name,
        nationality: data.nationality,
        city: data.city,
        main_role: data.mainRole,
        sub_roles: data.subRoles,
        languages: data.languages,
        atividade: data.atividade,
        atividade_number: data.atividadeNumber,
        admin_notes: data.adminNotes,
      })
      .eq("user_id", uid);
    if (data.phone) {
      await supabaseAdmin.from("worker_contacts").upsert({ user_id: uid, phone: data.phone }, { onConflict: "user_id" });
    }

    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: adminId,
      admin_email: adminEmail,
      action: "create",
      target_type: "worker",
      target_id: uid,
      target_label: data.name,
      details: {},
    });
    return { ok: true };
  });

// ── WRITE: create business account manually ──────────────────────────────────
export const consoleCreateBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        name: z.string().min(1).max(160),
        email: z.string().email().max(200),
        displayInitials: z.string().max(40).optional().default(""),
        city: z.string().max(80).optional().default(""),
        category: z.string().max(80).optional().default(""),
        subSector: z.string().max(120).optional().default(""),
        contactName: z.string().max(120).optional().default(""),
        contactPhone: z.string().max(40).optional().default(""),
        nif: z.string().max(40).optional().default(""),
        languagesRequired: z.array(z.string().max(60)).max(40).optional().default([]),
        preferredRoles: z.array(z.string().max(60)).max(40).optional().default([]),
        adminNotes: z.string().max(2000).optional().default(""),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { userId: adminId, email: adminEmail } = await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      password: crypto.randomUUID() + "Aa1!",
      user_metadata: { full_name: data.name, account_type: "business" },
    });
    if (cErr || !created.user) throw new Error(cErr?.message ?? "Could not create business.");
    const uid = created.user.id;

    await supabaseAdmin
      .from("business_profiles")
      .update({
        business_name: data.name,
        city: data.city,
        category: data.category,
        sub_sector: data.subSector,
        nif: data.nif,
        display_initials: data.displayInitials,
        languages_required: data.languagesRequired,
        preferred_roles: data.preferredRoles,
        admin_notes: data.adminNotes,
      })
      .eq("user_id", uid);
    await supabaseAdmin.from("business_contacts").upsert(
      { user_id: uid, phone: data.contactPhone, contact_name: data.contactName, contact_position: "" },
      { onConflict: "user_id" },
    );

    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: adminId,
      admin_email: adminEmail,
      action: "create",
      target_type: "business",
      target_id: uid,
      target_label: data.name,
      details: {},
    });
    return { ok: true };
  });
