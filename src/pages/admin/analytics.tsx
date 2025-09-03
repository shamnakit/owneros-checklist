// pages/admin/analytics.tsx
// Mockup Dashboard: PostHog-style analytics for Bizsystem
// - TailwindCSS UI, Recharts charts
// - Fake data generators now; easy to wire to PostHog later
// - Sections: KPI Cards, Activation Funnel, Events Over Time, Module Adoption, Interest (Pro/Premium)

import React, { useMemo } from "react";
import Head from "next/head";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowRight, TrendingUp, Users2, FileText, MousePointerClick, Activity, Sparkles } from "lucide-react";

// ====== Mock Data ======
function useMockData() {
  // time series last 14 days
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    return label;
  });

  const signups = days.map((label, i) => ({ label, value: 40 + Math.round(20 * Math.sin(i / 2)) + (i % 3) * 5 }));
  const activations = days.map((label, i) => ({ label, value: Math.max(0, signups[i].value - 12 - (i % 4) * 2) }));
  const exports = days.map((label, i) => ({ label, value: Math.max(0, activations[i].value - 10 + (i % 5)) }));

  const funnel = [
    { step: "Visits", count: 4200 },
    { step: "Signups", count: 850 },
    { step: "Activated (≥1 หมวด)", count: 520 },
    { step: "Export Attempt", count: 210 },
    { step: "Interest Pro/Premium", count: 96 },
  ];

  const moduleAdoption = [
    { name: "Strategy", users: 410 },
    { name: "Org", users: 380 },
    { name: "SOP", users: 260 },
    { name: "HR", users: 330 },
    { name: "Finance", users: 345 },
    { name: "Sales", users: 290 },
  ];

  const interest = [
    { name: "Pro", value: 72 },
    { name: "Premium", value: 24 },
  ];

  const totals = useMemo(() => {
    const signupTotal = signups.reduce((a, b) => a + b.value, 0);
    const activationTotal = activations.reduce((a, b) => a + b.value, 0);
    const exportTotal = exports.reduce((a, b) => a + b.value, 0);
    const conv = funnel[4].count / Math.max(1, funnel[1].count); // Interest / Signups
    return { signupTotal, activationTotal, exportTotal, conv };
  }, []);

  return { days, signups, activations, exports, funnel, moduleAdoption, interest, totals };
}

// ====== UI ======
export default function AdminAnalyticsPage() {
  const { signups, activations, exports, funnel, moduleAdoption, interest, totals } = useMockData();

  const pieColors = ["#2563eb", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"]; // automatic colors

  return (
    <>
      <Head>
        <title>Analytics – Bizsystem</title>
      </Head>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPI icon={<Users2 className="h-5 w-5" />} label="Signups (14d)" value={totals.signupTotal.toLocaleString()} sub="Users registered" />
            <KPI icon={<Activity className="h-5 w-5" />} label="Activations (14d)" value={totals.activationTotal.toLocaleString()} sub=">=1 หมวดสำเร็จ" />
            <KPI icon={<FileText className="h-5 w-5" />} label="Export Attempts (14d)" value={totals.exportTotal.toLocaleString()} sub="กด Export" />
            <KPI icon={<TrendingUp className="h-5 w-5" />} label="Signup → Interest" value={(totals.conv * 100).toFixed(1) + "%"} sub="Pro/Premium" />
          </div>

          {/* Events Over Time */}
          <Card title="Events Over Time – Signups / Activations / Export">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" type="category" allowDuplicatedCategory={false} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="value" data={signups} name="Signups" dot={false} />
                  <Line dataKey="value" data={activations} name="Activations" dot={false} />
                  <Line dataKey="value" data={exports} name="Export Attempts" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Activation Funnel */}
          <Card title="Activation Funnel">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {funnel.map((f, i) => (
                <div key={f.step} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-600">Step {i + 1}</div>
                  <div className="mt-1 text-sm font-medium">{f.step}</div>
                  <div className="mt-2 text-2xl font-bold">{f.count.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Module Adoption */}
          <Card title="Module Adoption (Users by Category)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduleAdoption}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Interest Capture */}
          <Card title="Interest (Pro vs Premium)">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="value" data={interest} nameKey="name" innerRadius={50} outerRadius={80} label>
                      {interest.map((_, idx) => (
                        <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="text-sm text-slate-600">Top signals</div>
                <ul className="text-sm list-disc list-inside text-slate-800 space-y-2">
                  <li>Pro สนใจสูงในผู้ใช้ที่กด Export ≥ 2 ครั้ง</li>
                  <li>Premium มักเกิดหลังมีผู้ใช้ ≥3 คน/องค์กร</li>
                  <li>อุตสาหกรรม Food/Factory มีอัตรา Conversion สูง</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* CTA to PostHog */}
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 bg-white flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-slate-900 font-semibold">เชื่อมข้อมูลจริงจาก PostHog</div>
              <div className="text-slate-600 text-sm">ใส่ KEY/Host แล้วเรียก API → แทนที่ mock ด้วยข้อมูลจริง</div>
            </div>
            <a href="/settings/analytics" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50">
              ไปตั้งค่า Analytics <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ====== Small UI helpers ======
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function KPI({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 text-slate-700">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</div>
        <div>
          <div className="text-xs text-slate-600">{label}</div>
          <div className="text-2xl font-bold leading-tight">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
