import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/components/console/ui";
import { Field, TextInput, TextArea, SelectInput, PrimaryButton, ToggleRow } from "@/components/console/forms";
import { getEmailAdminData, saveEmailTemplate, sendAdminEmail } from "@/lib/emails.functions";
import { renderEmailTemplate, SAMPLE_VARS } from "@/lib/emailRender";
import { timeAgo } from "@/data/utils";

export const Route = createFileRoute("/console/emails")({
  head: () => ({ meta: [{ title: "Emails — Shiftinger admin" }] }),
  component: EmailsPage,
});

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  body: string;
  enabled: boolean;
  updated_at: string;
}

interface OutboxRow {
  id: string;
  template_key: string | null;
  recipient_email: string;
  subject: string;
  status: string;
  error: string | null;
  triggered_by: string;
  created_at: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  account_type: string;
  status: string;
}

function EmailsPage() {
  const fetchData = useServerFn(getEmailAdminData);
  const saveTemplate = useServerFn(saveEmailTemplate);
  const sendEmail = useServerFn(sendAdminEmail);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-emails"],
    queryFn: () => fetchData(),
  });

  // ── Template editor state ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // ── Send panel state ──
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendTemplateKey, setSendTemplateKey] = useState<string>("");
  const [audience, setAudience] = useState("all");
  const [targetUserId, setTargetUserId] = useState("");

  const templates = (data?.templates ?? []) as EmailTemplate[];
  const outbox = (data?.outbox ?? []) as OutboxRow[];
  const users = (data?.users ?? []) as UserRow[];

  const startEdit = (t: EmailTemplate) => {
    setEditingId(t.id);
    setSubject(t.subject);
    setBody(t.body);
    setEnabled(t.enabled);
    setShowPreview(false);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      saveTemplate({ data: { id: editingId!, subject, body, enabled } }),
    onSuccess: () => {
      toast.success("Template saved");
      queryClient.invalidateQueries({ queryKey: ["admin-emails"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save template"),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      sendEmail({
        data: {
          templateKey: sendTemplateKey || null,
          subject: sendSubject,
          body: sendBody,
          audience: audience as "all" | "workers" | "businesses" | "user",
          userId: audience === "user" ? targetUserId || undefined : undefined,
        },
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-emails"] });
      if (res.sent > 0) {
        toast.success(`Sent ${res.sent} of ${res.total} email${res.total !== 1 ? "s" : ""}`);
      } else if (res.queued > 0) {
        toast.info(
          `${res.queued} email${res.queued !== 1 ? "s" : ""} saved to the outbox as queued — email sending isn't configured yet`,
        );
      } else {
        toast.error(`All ${res.failed} sends failed — check the outbox for details`);
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not send"),
  });

  const audienceCount =
    audience === "all"
      ? users.length
      : audience === "workers"
        ? users.filter((u) => u.account_type === "worker").length
        : audience === "businesses"
          ? users.filter((u) => u.account_type === "business").length
          : targetUserId
            ? 1
            : 0;

  if (isLoading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="animate-spin text-pine" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Emails" subtitle="Templates, approval notifications and one-off sends" />

      {!data?.emailConfigured && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-dark/20 bg-amber-soft px-4 py-3 text-sm text-amber-dark">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">Email sending isn't configured yet.</span> Approval emails and
            one-off sends are saved to the outbox below as <span className="font-medium">queued</span> so
            nothing is lost — set up an email domain later and new sends will go out for real.
          </p>
        </div>
      )}

      {/* ── Templates ── */}
      <Panel title="Email templates" action={<Pill tone="pine">{templates.length} templates</Pill>}>
        <div className="grid gap-4 lg:grid-cols-[260px,1fr]">
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => startEdit(t)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  editingId === t.id ? "border-pine bg-pine-soft" : "border-line bg-white hover:bg-mist"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{t.name}</span>
                  <Pill tone={t.enabled ? "pine" : "slate"}>{t.enabled ? "On" : "Off"}</Pill>
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-slate">{t.subject}</span>
              </button>
            ))}
          </div>

          {editingId ? (
            <div className="space-y-3">
              <Field label="Subject">
                <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} />
              </Field>
              <Field label="Body" hint="Placeholders: {{name}}, {{email}}, {{app_url}}">
                <TextArea rows={9} value={body} onChange={(e) => setBody(e.target.value)} />
              </Field>
              <ToggleRow
                label="Template enabled"
                description="Disabled templates are skipped (e.g. no approval email is sent)"
                checked={enabled}
                onChange={setEnabled}
              />
              <div className="flex flex-wrap items-center gap-2">
                <PrimaryButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Save template
                </PrimaryButton>
                <button
                  onClick={() => setShowPreview((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-mist"
                >
                  {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
                  {showPreview ? "Hide preview" : "Preview"}
                </button>
              </div>
              {showPreview && (
                <div className="rounded-xl border border-line bg-mist/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate">Preview (sample data)</p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {renderEmailTemplate(subject, SAMPLE_VARS)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink/80">
                    {renderEmailTemplate(body, SAMPLE_VARS)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-line text-sm text-slate">
              Select a template to edit it
            </div>
          )}
        </div>
      </Panel>

      {/* ── Compose & send ── */}
      <Panel title="Send an email" action={<Pill tone="amber">{audienceCount} recipient{audienceCount !== 1 ? "s" : ""}</Pill>}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Start from template" hint="Copies the template into the fields below — you can still edit before sending">
              <SelectInput
                value={sendTemplateKey}
                onChange={(key) => {
                  setSendTemplateKey(key);
                  const t = templates.find((x) => x.template_key === key);
                  if (t) {
                    setSendSubject(t.subject);
                    setSendBody(t.body);
                  }
                }}
                options={[
                  { value: "", label: "Custom (blank)" },
                  ...templates.map((t) => ({ value: t.template_key, label: t.name })),
                ]}
              />
            </Field>
            <Field label="Send to">
              <SelectInput
                value={audience}
                onChange={setAudience}
                options={[
                  { value: "all", label: "All users" },
                  { value: "workers", label: "All workers" },
                  { value: "businesses", label: "All businesses" },
                  { value: "user", label: "One specific user" },
                ]}
              />
            </Field>
          </div>

          {audience === "user" && (
            <Field label="User">
              <SelectInput
                value={targetUserId}
                onChange={setTargetUserId}
                options={[
                  { value: "", label: "— select a user —" },
                  ...users.map((u) => ({
                    value: u.id,
                    label: `${u.full_name || u.email} · ${u.account_type} (${u.email})`,
                  })),
                ]}
              />
            </Field>
          )}

          <Field label="Subject">
            <TextInput value={sendSubject} onChange={(e) => setSendSubject(e.target.value)} placeholder="Subject…" />
          </Field>
          <Field label="Message" hint="Placeholders: {{name}}, {{email}}, {{app_url}} — personalised per recipient">
            <TextArea rows={7} value={sendBody} onChange={(e) => setSendBody(e.target.value)} placeholder="Write your message…" />
          </Field>

          <PrimaryButton
            onClick={() => sendMutation.mutate()}
            disabled={
              sendMutation.isPending ||
              !sendSubject.trim() ||
              !sendBody.trim() ||
              audienceCount === 0
            }
          >
            {sendMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Send to {audienceCount} recipient{audienceCount !== 1 ? "s" : ""}
          </PrimaryButton>
        </div>
      </Panel>

      {/* ── Outbox ── */}
      <Panel title="Outbox" action={<Pill tone="slate">last {outbox.length}</Pill>}>
        {outbox.length === 0 ? (
          <div className="grid h-24 place-items-center text-sm text-slate">
            <span className="inline-flex items-center gap-2">
              <Mail size={16} /> No emails yet
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-mist text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="px-4 py-3 font-semibold">Recipient</th>
                  <th className="px-4 py-3 font-semibold">Subject</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {outbox.map((row) => (
                  <tr key={row.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3 text-ink">{row.recipient_email}</td>
                    <td className="max-w-[260px] truncate px-4 py-3 text-ink/80" title={row.subject}>
                      {row.subject}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={row.triggered_by === "system" ? "blue" : "slate"}>
                        {row.triggered_by === "system" ? "Automatic" : "Admin"}
                      </Pill>
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={row.status === "sent" ? "pine" : row.status === "queued" ? "amber" : "red"}>
                        {row.status}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-slate">{timeAgo(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
