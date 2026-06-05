import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAdminStore } from "@/data/adminStore";

const COLORS = ["#1D9E75", "#FAC775", "#0f766e", "#94a3b8", "#0ea5e9", "#f97316"];

function countBy<T>(rows: T[], key: (r: T) => string): { name: string; value: number }[] {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const k = key(r) || "—";
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function Empty() {
  return <div className="grid h-[220px] place-items-center text-sm text-slate">No data yet.</div>;
}

export function NationalityDonut() {
  const { workers } = useAdminStore();
  const data = useMemo(() => countBy(workers, (w) => w.nationality), [workers]);
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BusinessCategoryBar() {
  const { businesses } = useAdminStore();
  const data = useMemo(() => countBy(businesses, (b) => b.category), [businesses]);
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#1D9E75" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MatchStatusBar() {
  const { matches } = useAdminStore();
  const data = useMemo(() => countBy(matches, (m) => m.status), [matches]);
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#FAC775" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ShiftStatusBar() {
  const { shifts } = useAdminStore();
  const data = useMemo(() => countBy(shifts, (s) => s.status), [shifts]);
  if (data.length === 0) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
