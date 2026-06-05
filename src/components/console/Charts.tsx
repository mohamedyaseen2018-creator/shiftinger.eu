import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  SHIFTS_BY_MONTH,
  NATIONALITY_SPLIT,
  REGISTRATIONS_BY_WEEK,
  TOP_SECTORS,
} from "@/data/adminMock";

const PINE = "#1D9E75";
const AMBER = "#FAC775";
const SLATE = "#475569";
const DONUT = ["#1D9E75", "#FAC775", "#475569", "#CBD5E1"];

const axisStyle = { fontSize: 12, fill: SLATE };
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #E2E8E5",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

export function ShiftsBarChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={SHIFTS_BY_MONTH} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F0" />
        <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="confirmed" name="Confirmed" fill={PINE} radius={[4, 4, 0, 0]} />
        <Bar dataKey="unmatched" name="Unmatched" fill={AMBER} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function NationalityDonut() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={NATIONALITY_SPLIT}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
        >
          {NATIONALITY_SPLIT.map((_, i) => (
            <Cell key={i} fill={DONUT[i % DONUT.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RegistrationsLine() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={REGISTRATIONS_BY_WEEK}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2F0" />
        <XAxis dataKey="week" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="count"
          name="New workers"
          stroke={PINE}
          strokeWidth={2.5}
          dot={{ r: 3, fill: PINE }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SectorsBar() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={TOP_SECTORS} layout="vertical" margin={{ left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EEF2F0" />
        <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="sector"
          tick={axisStyle}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F1F5F4" }} />
        <Bar dataKey="count" name="Businesses" fill={SLATE} radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
