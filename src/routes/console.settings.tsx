import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, Pill } from "@/components/console/ui";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ADMIN_USERS } from "@/data/adminMock";
import { timeAgo } from "@/data/utils";

export const Route = createFileRoute("/console/settings")({
  head: () => ({ meta: [{ title: "Settings — Shiftinger admin" }] }),
  component: SettingsPage,
});

const WEIGHT_KEYS = [
  { key: "skills", label: "Skills match" },
  { key: "availability", label: "Availability" },
  { key: "rating", label: "Rating" },
  { key: "location", label: "Location" },
] as const;

const EVENTS = [
  "New worker registration",
  "Shift confirmed",
  "Application nearing expiry",
  "Dispute raised",
  "Business verification",
] as const;

function SettingsPage() {
  const [windowStart, setWindowStart] = useState("07:00");
  const [windowEnd, setWindowEnd] = useState("12:00");
  const [windowHours, setWindowHours] = useState(2);
  const [weights, setWeights] = useState<Record<string, number>>({
    skills: 40,
    availability: 25,
    rating: 20,
    location: 15,
  });
  const [alerts, setAlerts] = useState<Record<string, { email: boolean; sms: boolean }>>(
    Object.fromEntries(EVENTS.map((e) => [e, { email: true, sms: false }])),
  );

  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform configuration and admin management" />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Platform settings */}
        <Panel title="Confirmation window">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Window opens (Lisbon)">
              <input
                type="time"
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-pine"
              />
            </Field>
            <Field label="Window closes (Lisbon)">
              <input
                type="time"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-pine"
              />
            </Field>
            <Field label="Confirmation hours">
              <input
                type="number"
                min={1}
                max={6}
                value={windowHours}
                onChange={(e) => setWindowHours(Number(e.target.value))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-pine"
              />
            </Field>
          </div>
          <button
            onClick={() => toast.success("Confirmation window saved")}
            className="mt-4 rounded-xl bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-dark"
          >
            Save changes
          </button>
        </Panel>

        {/* Match scoring weights */}
        <Panel title="Match scoring weights">
          <div className="space-y-5">
            {WEIGHT_KEYS.map((w) => (
              <div key={w.key}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-ink">{w.label}</span>
                  <span className="font-semibold text-pine-dark">{weights[w.key]}%</span>
                </div>
                <Slider
                  value={[weights[w.key]]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(v) => setWeights((p) => ({ ...p, [w.key]: v[0] }))}
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate">
            Total: <span className="font-semibold text-ink">{Object.values(weights).reduce((a, b) => a + b, 0)}%</span>
            {Object.values(weights).reduce((a, b) => a + b, 0) !== 100 && " — should sum to 100%"}
          </p>
        </Panel>

        {/* Notification settings */}
        <Panel title="Notification settings" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="py-2 font-semibold">Event</th>
                  <th className="py-2 text-center font-semibold">Email</th>
                  <th className="py-2 text-center font-semibold">SMS</th>
                </tr>
              </thead>
              <tbody>
                {EVENTS.map((e) => (
                  <tr key={e} className="border-t border-line">
                    <td className="py-3 text-ink">{e}</td>
                    <td className="py-3 text-center">
                      <Switch
                        checked={alerts[e].email}
                        onCheckedChange={(v) => setAlerts((p) => ({ ...p, [e]: { ...p[e], email: v } }))}
                      />
                    </td>
                    <td className="py-3 text-center">
                      <Switch
                        checked={alerts[e].sms}
                        onCheckedChange={(v) => setAlerts((p) => ({ ...p, [e]: { ...p[e], sms: v } }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Admin user management */}
        <Panel
          title="Admin users"
          className="lg:col-span-2"
          action={
            <button
              onClick={() => toast.success("Invite sent")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-pine px-3 py-2 text-sm font-medium text-white hover:bg-pine-dark"
            >
              <Plus size={15} /> Invite admin
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="py-2 font-semibold">Name</th>
                  <th className="py-2 font-semibold">Email</th>
                  <th className="py-2 font-semibold">Role</th>
                  <th className="py-2 font-semibold">Last active</th>
                </tr>
              </thead>
              <tbody>
                {ADMIN_USERS.map((u) => (
                  <tr key={u.id} className="border-t border-line">
                    <td className="py-3 font-medium text-ink">
                      <span className="inline-flex items-center gap-2">
                        <Shield size={14} className="text-pine" />
                        {u.name}
                      </span>
                    </td>
                    <td className="py-3 text-slate">{u.email}</td>
                    <td className="py-3">
                      <Pill tone={u.role === "Super admin" ? "pine" : "slate"}>{u.role}</Pill>
                    </td>
                    <td className="py-3 text-slate">{timeAgo(u.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate">{label}</span>
      {children}
    </label>
  );
}
