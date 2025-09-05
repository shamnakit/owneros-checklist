// src/pages/admin/analytics/index.tsx
import React, { useMemo } from "react";
import Head from "next/head";
import AdminTabs from "@/components/admin/AdminTabs";
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
import { ArrowRight, TrendingUp, Users, FileText, Activity } from "lucide-react";

// ------- Mock Data -------
function useMockData() {
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  });

  const signups = days.map((label, i) => ({
    label,
    value: 40 + Math.round(20 * Math.sin(i / 2)) + (i % 3) * 5,
  }));
  const activations = days.map((label, i) => ({
    label,
    value: Math.max(0, signups[i].value - 12 - (i % 4) * 2),
  }));
  const expAttempts = days.map((label, i) => ({
    label,
    value: Math.max(0, activations[i].value - 10 + (i % 5)),
  }));

  // รวมเป็น timeline เดียวให้ Recharts ใช้สะดวก
  const timeline = days.map((label, i) => ({
    label,
    signups: signups[i].value,
    activations: activations[i].value,
    exports: expAttempts[i].value,
  }));

  const funnel = [
    { step: "Visits", count: 4200 },
    { step: "Signups", count: 850 },
    { step: "Activated (≥1 category)", count: 520 },
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
    const sum = (arr: { value: number }[]) => arr.reduce((a, b) => a + b.value, 0);
    const conv = funnel[4].count / Math.max(1, funnel[1].count); // interest / signups
    return {
      signupTotal: sum(signups),
      activationTotal: sum(activations),
      exportTotal: sum(expAttempts),
      conv,
    };
  }, []); // mock คงที่

  return { timeline, funnel, moduleAdoption, interest, totals };
}

// ------- Page -------
export default function AnalyticsOverviewPage() {
  const { timeline, funnel, moduleAdoption, interest, totals } = useMockData();
  const pieColors = ["#7c3aed", "#22c55e", "#f59e0b", "#ef4444", "#0ea5e9"];

  return (
    <>
      <Head>
        <title>Analytics - Bizzystem</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Analytics</h1>
        </div>

        <AdminTabs />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPI
            icon={<Users className="h-5 w-5" />}
            label="Signups (14d)"
            value={totals.signupTotal.toLocaleString()}
            sub="Users registered"
          />
          <KPI
            icon={<Activity className="h-5 w-5" />}
            label="Activations (14d)"
            value={totals.activationTotal.toLocaleString()}
            sub={`${String.fromCharCode(0x2265)} 1 category`} // ≥ 1
          />
          <KPI
            icon={<FileText className="h-5 w-5" />}
            label="Export Attempts (14d)"
            value={totals.exportTotal.toLocaleString()}
            sub="Export clicked"
          />
          <KPI
            icon={<TrendingUp className="h-5 w-5" />}
            label="Signup → Interest"
            value={(totals.conv * 100).toFixed(1) + "%"}
            sub="Pro/Premium"
          />
        </div>

        {/* Events Over Time */}
        <Card title="Events Over Time - Signups / Activations / Export">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="signups" name="Signups" dot={false} />
                <Line type="monotone" dataKey="activations" name="Activations" dot={false} />
                <Line type="monotone" dataKey="exports" name="Export Attempts" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activation Funnel */}
        <Card title="Activation Funnel">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {funnel.map((f, i) => (
              <div key={f.step} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
                <div className="text-xs text-neutral-400">Step {i + 1}</div>
                <div className="mt-1 text-sm text-neutral-200 font-medium">{f.step}</div>
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

        {/* Interest */}
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
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 space-y-3">
              <div className="text-sm text-neutral-400">Top signals</div>
              <ul className="text-sm list-disc list-inside text-neutral-200 space-y-2">
                <li>
                  Pro interest is higher for users with {String.fromCharCode(0x2265)} 2 exports
                </li>
                <li>
                  Premium often after team size {String.fromCharCode(0x2265)} 3 users
                </li>
                <li>Factory vertical shows higher conversion</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="rounded-2xl border border-dashed border-neutral-800 p-6 bg-neutral-900/40 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-neutral-100 font-semibold">Connect real data from PostHog</div>
            <div className="text-neutral-400 text-sm">
              Set project key/host and call our API to replace mock data.
            </div>
          </div>
          <a
            href="/admin/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 px-4 py-2 hover:bg-neutral-800"
          >
            Go to Analytics Settings <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </>
  );
}

// ------- Small UI helpers -------
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300">
          {icon}
        </div>
        <div>
          <div className="text-xs text-neutral-400">{label}</div>
          <div className="text-2xl font-bold leading-tight">{value}</div>
          {sub && <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
