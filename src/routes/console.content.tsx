import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/console/ui";
import { Field, TextInput, TextArea, PrimaryButton, GhostButton } from "@/components/console/forms";
import { getSiteContent, consoleSaveSiteContent } from "@/lib/siteContent.functions";
import { CONTENT_GROUPS, CONTENT_DEFAULTS } from "@/data/siteContent";

export const Route = createFileRoute("/console/content")({
  head: () => ({ meta: [{ title: "Site content — Shiftinger admin" }] }),
  component: ContentPage,
});

function ContentPage() {
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingGroup, setSavingGroup] = useState<string | null>(null);

  useEffect(() => {
    getSiteContent()
      .then((res) => {
        const merged: Record<string, string> = { ...CONTENT_DEFAULTS, ...(res.overrides ?? {}) };
        setValues(merged);
      })
      .catch(() => toast.error("Could not load content"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, v: string) => setValues((p) => ({ ...p, [key]: v }));

  const saveGroup = async (groupId: string, keys: string[]) => {
    const entries = keys.map((key) => ({ key, value: values[key] ?? "" }));
    if (entries.some((e) => !e.value.trim())) {
      toast.error("All fields are required.");
      return;
    }
    setSavingGroup(groupId);
    try {
      await consoleSaveSiteContent({ data: { entries } });
      toast.success("Content saved — live on the website");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSavingGroup(null);
    }
  };

  const resetGroup = (keys: string[]) =>
    setValues((p) => {
      const next = { ...p };
      keys.forEach((k) => (next[k] = CONTENT_DEFAULTS[k] ?? ""));
      return next;
    });

  if (loading) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="animate-spin text-pine" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Site content" subtitle="Edit the text shown on the public website. Changes go live on save." />
      <div className="space-y-6">
        {CONTENT_GROUPS.map((group) => {
          const keys = group.fields.map((f) => f.key);
          return (
            <Panel key={group.id} title={group.label}>
              <p className="mb-4 -mt-2 text-xs text-slate">{group.description}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <Field
                    key={field.key}
                    label={field.label}
                    required
                    className={field.type === "textarea" ? "sm:col-span-2" : undefined}
                  >
                    {field.type === "textarea" ? (
                      <TextArea value={values[field.key] ?? ""} onChange={(e) => set(field.key, e.target.value)} />
                    ) : (
                      <TextInput value={values[field.key] ?? ""} onChange={(e) => set(field.key, e.target.value)} />
                    )}
                  </Field>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <GhostButton onClick={() => resetGroup(keys)}>
                  <RotateCcw size={15} /> Reset to default
                </GhostButton>
                <PrimaryButton onClick={() => saveGroup(group.id, keys)} disabled={savingGroup === group.id}>
                  <Save size={15} /> {savingGroup === group.id ? "Saving…" : "Save section"}
                </PrimaryButton>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
