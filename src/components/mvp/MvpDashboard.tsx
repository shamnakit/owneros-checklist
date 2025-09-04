import React from "react";
import { Users, FileText, TrendingUp, DollarSign, Target, Download } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// ---- Demo data (แทนที่ด้วยข้อมูลจริงภายหลังได้) ----
const tractionData = [
  { month: "May", signup: 10, active: 6 },
  { month: "Jun", signup: 22, active: 15 },
  { month: "Jul", signup: 35, active: 26 },
  { month: "Aug", signup: 52, active: 40 },
  { month: "Sep", signup: 70, active: 55 },
];

const revenueData = [
  { month: "May", mrr: 12000 },
  { month: "Jun", mrr: 35000 },
  { month: "Jul", mrr: 60000 },
  { month: "Aug", mrr: 95000 },
  { month: "Sep", mrr: 140000 },
];

const scoreData = [
  { category: "Strategy", score: 72 },
  { category: "Org", score: 65 },
  { category: "SOP", score: 58 },
  { category: "HR", score: 69 },
  { category: "Finance", score: 55 },
  { category: "Sales", score: 63 },
];

function StatCard({
  icon: Icon,
  title,
  value,
  note,
  accent = "from-blue-500 to-indigo-500",
}: {
  icon: any;
  title: string;
  value: string | number;
  note?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl p-4 bg-white/90 dark:bg-zinc-900 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {note ? <p className="mt-2 text-xs text-zinc-500">{note}</p> : null}
    </div>
  );
}

export default function MvpDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50">
      {/* Topbar */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600" />
            <div className="text-sm leading-tight">
              <div className="font-semibold tracking-tight">Bizsystem MVP Dashboard</div>
              <div className="text-xs text-zinc-500">Traction • Finance • Proof of Value</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-5 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Users} title="Active Orgs" value={55} note="Sep 2025" />
          <StatCard icon={FileText} title="Evidence Uploaded" value={312} note="รวมทุกหมวด" accent="from-emerald-500 to-teal-500" />
          <StatCard icon={DollarSign} title="MRR" value="฿140,000" note="↑ 45k MoM" accent="from-sky-500 to-cyan-500" />
          <StatCard icon={Download} title="Binder Exported" value={18} note="ใช้จริงกับ FA/Bank" accent="from-rose-500 to-orange-500" />
        </div>

        {/* Traction Graph */}
        <div className="rounded-2xl bg-white/90 dark:bg-zinc-900 shadow-sm ring-1 ring-black/5 p-5">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Traction Growth
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tractionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RTooltip />
                <Legend />
                <Line type="monotone" dataKey="signup" name="Signups" stroke="#6366f1" />
                <Line type="monotone" dataKey="active" name="Active Orgs" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Finance Graph */}
        <div className="rounded-2xl bg-white/90 dark:bg-zinc-900 shadow-sm ring-1 ring-black/5 p-5">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Finance – MRR Growth
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RTooltip />
                <Line type="monotone" dataKey="mrr" name="MRR (฿)" stroke="#f59e0b" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proof of Value – Radar */}
        <div className="rounded-2xl bg-white/90 dark:bg-zinc-900 shadow-sm ring-1 ring-black/5 p-5">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" /> Proof of Value – Org Score by Category
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={scoreData} outerRadius={120}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="#ec4899" fill="#ec4899" fillOpacity={0.35} />
                <Legend />
                <RTooltip formatter={(v: number) => `${v}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
