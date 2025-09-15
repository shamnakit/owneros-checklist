// /src/pages/dashboard.tsx — CEOPolar Mission Control (7 Categories) v4.0

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import posthog from "posthog-js";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
  ReferenceLine,
  BarChart,
  Bar as RBar,
  LineChart,
  Line,
} from "recharts";
import {
  Wallet,
  Users,
  UserCircle2,
  Activity,
  Target,
  Sparkles,
  ShieldCheck,
  Leaf,
  Clock,
  FileText,
  Download,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react"; // ✅ แก้ปัญหา JSX.Element
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/utils/supabaseClient";

/* ====================== Types ====================== */

// 7 หมวดหลัก
type Category7Key =
  | "financial"
  | "customer"
  | "people"
  | "operational"
  | "strategy"
  | "innovation"
  | "esg";

type KpiUnit = "THB" | "PCT" | "DAYS" | "COUNT";

type KPI = {
  code: string;
  label: string;
  unit: KpiUnit;
  value: number;
  trend?: number[];
  mom?: number | null;
  yoy?: number | null;
  status: "green" | "amber" | "red";
  note?: string | null;
};

type CategoryPack = {
  key: Category7Key;
  label: string;
  color: string; // hex
  icon: LucideIcon; // ✅ แทน (props)=>JSX.Element
  primary: KPI; // การ์ดใหญ่สุดของหมวด
  secondary: KPI[]; // การ์ดเล็ก 4–8 ใบ
};

/** ---------- OwnerOS types (insights ด้านล่าง) ---------- */
type CategoryKey = "strategy" | "structure" | "sop" | "hr" | "finance" | "sales";
type CatRow = {
  category: CategoryKey | string;
  score: number;
  max_score_category: number;
  evidence_rate_pct: number;
};
type TotalRow = {
  total_score: number;
  max_score: number;
  tier_label: "Excellent" | "Developing" | "Early Stage";
};
type IndustryAvgRow = {
  industry_section: string;
  avg_score: number;
  avg_max_score: number;
};
type WarnRow = {
  category: CategoryKey | string;
  checklist_id: string;
  name: string;
};

/* ====================== Helpers ====================== */
const clampPct = (v: number) => Math.max(0, Math.min(100, v));
const fmtPct1 = (v: number) =>
  `${clampPct(v).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const fmtPct2 = (v: number) =>
  `${clampPct(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const fmtMoney2 = (v: number) =>
  v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toPct = (n: number, d: number) => (d ? (Number(n) / Number(d)) * 100 : 0);
const thaiTier = (t: TotalRow["tier_label"]) =>
  t === "Excellent" ? "Excellent" : t === "Developing" ? "Developing" : "Early Stage";

/* ====================== Thresholds (G/A/R) ====================== */
const traffic = {
  runway: (v: number) => (v >= 90 ? "green" : v >= 45 ? "amber" : "red"),
  revenueYoY: (v: number) => (v >= 15 ? "green" : v >= 5 ? "amber" : "red"),
  arDays: (v: number) => (v <= 45 ? "green" : v <= 60 ? "amber" : "red"),
  apDays: (v: number) => (v <= 45 ? "green" : v <= 60 ? "amber" : "red"),
  gm: (v: number) => (v >= 30 ? "green" : v >= 25 ? "amber" : "red"),
  nps: (v: number) => (v >= 50 ? "green" : v >= 30 ? "amber" : "red"),
  retention: (v: number) => (v >= 85 ? "green" : v >= 75 ? "amber" : "red"),
  turnover: (v: number) => (v <= 12 ? "green" : v <= 18 ? "amber" : "red"),
  inventoryDays: (v: number) => (v <= 45 ? "green" : v <= 60 ? "amber" : "red"),
} as const;

/* ====================== Mock Generators (MVP) ====================== */
const randSpark = (base: number, vol = 0.08, n = 24) =>
  Array.from({ length: n }).map((_, i) => base * (1 + (Math.sin((i + 3) * 1.3) * vol)));

function mockCategories(): CategoryPack[] {
  const revenueYoY = 18;
  const runway = 78;
  const ar30 = 505000;
  const ap30 = 325000;
  const gm = 28;
  const nps = 52;
  const retention = 86;
  const turnover = 10;
  const inventory = 42;

  return [
    {
      key: "financial",
      label: "Financial",
      color: "#10B981",
      icon: Wallet,
      primary: { code: "runway", label: "Cash & Runway (วัน)", unit: "DAYS", value: runway, trend: randSpark(75, 0.04), status: traffic.runway(runway) },
      secondary: [
        { code: "revenue", label: "รายได้เดือนนี้ (฿)", unit: "THB", value: 1_250_000, trend: randSpark(1_200_000, 0.12), mom: 12, yoy: revenueYoY, status: traffic.revenueYoY(revenueYoY) },
        { code: "netprofit", label: "กำไรสุทธิ (เดือนนี้)", unit: "THB", value: 185_000, status: "green" },
        { code: "gm", label: "กำไรขั้นต้น (GM%)", unit: "PCT", value: gm, status: traffic.gm(gm) },
        { code: "arOver30", label: "AR > 30 วัน (฿)", unit: "THB", value: ar30, status: ar30 <= 400000 ? "green" : ar30 <= 600000 ? "amber" : "red" },
        { code: "apOver30", label: "AP > 30 วัน (฿)", unit: "THB", value: ap30, status: ap30 <= 300000 ? "green" : ap30 <= 450000 ? "amber" : "red" },
        { code: "inventoryDays", label: "Inventory Days", unit: "DAYS", value: inventory, status: traffic.inventoryDays(inventory) },
      ],
    },
    {
      key: "customer",
      label: "Customer",
      color: "#0EA5E9",
      icon: Users,
      primary: { code: "retention", label: "Retention Rate", unit: "PCT", value: retention, trend: randSpark(86, 0.02), status: traffic.retention(retention) },
      secondary: [
        { code: "nps", label: "NPS", unit: "PCT", value: nps, status: traffic.nps(nps) },
        { code: "cac", label: "CAC (฿/ลูกค้า)", unit: "THB", value: 950, status: "amber" },
        { code: "clv", label: "CLV (฿)", unit: "THB", value: 18_500, status: "green" },
        { code: "conv", label: "Conversion Rate", unit: "PCT", value: 4.8, status: "green" },
        { code: "churn", label: "Churn Rate", unit: "PCT", value: 2.6, status: "green" },
      ],
    },
    {
      key: "people",
      label: "People",
      color: "#8B5CF6",
      icon: UserCircle2,
      primary: { code: "turnover", label: "Turnover Rate (ปี)", unit: "PCT", value: turnover, trend: randSpark(11, 0.06), status: traffic.turnover(turnover) },
      secondary: [
        { code: "engagement", label: "Engagement Score", unit: "PCT", value: 76, status: "green" },
        { code: "vacancy", label: "Vacancy Rate", unit: "PCT", value: 3.2, status: "green" },
        { code: "absent", label: "Absenteeism", unit: "PCT", value: 1.2, status: "green" },
        { code: "tth", label: "Time-to-Hire (วัน)", unit: "DAYS", value: 22, status: "amber" },
      ],
    },
    {
      key: "operational",
      label: "Operational",
      color: "#F59E0B",
      icon: Activity,
      primary: { code: "oft", label: "Order Fulfillment Cycle Time (วัน)", unit: "DAYS", value: 3.6, trend: randSpark(3.8, 0.1), status: "green" },
      secondary: [
        { code: "rpe", label: "Revenue / Employee", unit: "THB", value: 385_000, status: "green" },
        { code: "defect", label: "Defect Rate", unit: "PCT", value: 0.9, status: "green" },
        { code: "otd", label: "On-time Delivery", unit: "PCT", value: 94, status: "green" },
        { code: "backlog", label: "Backlog Fill Rate", unit: "PCT", value: 78, status: "amber" },
      ],
    },
    {
      key: "strategy",
      label: "Strategy & Market",
      color: "#2563EB",
      icon: Target,
      primary: { code: "mshare", label: "Market Share", unit: "PCT", value: 8.4, trend: randSpark(8.1, 0.08), status: "green" },
      secondary: [
        { code: "ttm", label: "Time-to-Market (วัน)", unit: "DAYS", value: 58, status: "amber" },
        { code: "winrate", label: "Win Rate", unit: "PCT", value: 28, status: "amber" },
        { code: "pipeline", label: "Pipeline Coverage (x)", unit: "COUNT", value: 2.9, status: "green" },
      ],
    },
    {
      key: "innovation",
      label: "Innovation",
      color: "#EC4899",
      icon: Sparkles,
      primary: { code: "newrev", label: "Revenue from New Products", unit: "PCT", value: 17, trend: randSpark(16, 0.08), status: "green" },
      secondary: [
        { code: "rnd", label: "R&D Spend / Rev", unit: "PCT", value: 6.2, status: "green" },
        { code: "ideas", label: "Idea Generation Rate", unit: "COUNT", value: 28, status: "green" },
        { code: "t2proto", label: "Time-to-Prototype (วัน)", unit: "DAYS", value: 21, status: "green" },
      ],
    },
    {
      key: "esg",
      label: "ESG",
      color: "#84CC16",
      icon: Leaf,
      primary: { code: "ghg", label: "GHG Intensity (tCO₂e/฿Rev)", unit: "COUNT", value: 0.62, trend: randSpark(0.66, 0.05), status: "green" },
      secondary: [
        { code: "waste", label: "Waste Reduction YoY", unit: "PCT", value: 12, status: "green" },
        { code: "energy", label: "Energy / Unit", unit: "COUNT", value: 1.14, status: "amber" },
        { code: "diversity", label: "Diversity Index", unit: "PCT", value: 61, status: "green" },
        { code: "safety", label: "Safety TRIR", unit: "COUNT", value: 0.8, status: "green" },
        { code: "gov", label: "Governance Compliance", unit: "PCT", value: 92, status: "green" },
      ],
    },
  ];
}

/* ====================== OwnerOS constants (insights) ====================== */
const CAT_LABEL: Record<CategoryKey, string> = {
  strategy: "Strategy",
  structure: "Org Structure",
  sop: "SOP",
  hr: "HR",
  finance: "Finance",
  sales: "Sales",
};
const CAT_ORDER: CategoryKey[] = ["strategy", "structure", "sop", "hr", "finance", "sales"];
const COLOR: Record<CategoryKey, string> = {
  strategy: "#2563eb",
  structure: "#a855f7",
  sop: "#f59e0b",
  hr: "#ec4899",
  finance: "#16a34a",
  sales: "#f59e0b",
};

/* ====================== Page Component ====================== */
function DashboardPageImpl() {
  const { profile } = useUserProfile();
  const uid = (profile as any)?.id || null;
  const companyName = profile?.company_name || "CEOPolar";

  /* ------- State: 7 หมวด ------- */
  const packs = useMemo(() => mockCategories(), []);
  const [active, setActive] = useState<Category7Key>(packs[0].key);

  /* ------- Header year selection (ยังคงรูปแบบเดิม) ------- */
  const thisYear = new Date().getFullYear();
  const [availableYears, setAvailableYears] = useState<number[]>([thisYear]);
  const [year, setYear] = useState<number>(thisYear);
  const [compareYear, setCompareYear] = useState<number>(thisYear - 1);

  /* ------- OwnerOS (Insights ด้านล่าง) ------- */
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [total, setTotal] = useState<Record<number, TotalRow | undefined>>({});
  const [cats, setCats] = useState<Record<number, CatRow[]>>({});
  const [warns, setWarns] = useState<Record<number, WarnRow[]>>({});
  const [trend, setTrend] = useState<Array<{ year: number; value: number }>>([]);

  useEffect(() => {
    try {
      posthog?.capture("Dashboard Viewed", { section: "mission_control_7cats", active });
    } catch {}
  }, [active]);

  // โหลดปี (OwnerOS)
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase.rpc("fn_available_years_for_me");
      if (!mounted) return;
      if (!data?.length) return;
      const years = data.map((r: any) => Number(r.year_version)).filter(Boolean).sort((a: number, b: number) => a - b);
      setAvailableYears(years);
      setYear(years[years.length - 1]);
      setCompareYear(years.length > 1 ? years[years.length - 2] : years[0]);
    })();
    return () => { mounted = false; };
  }, [uid]);

  useEffect(() => {
    if (year === compareYear && availableYears.length > 1) {
      const alt = availableYears.find((y) => y !== year)!;
      setCompareYear(alt);
    }
  }, [year, compareYear, availableYears]);

  // โหลด OwnerOS insights
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const years = [year, compareYear];
        const results = await Promise.all(
          years.map(async (y) => {
            const [t, c, w] = await Promise.all([
              supabase.rpc("fn_score_total_for_me", { p_year: y, p_require_evidence: true }),
              supabase.rpc("fn_score_by_category_for_me", { p_year: y, p_require_evidence: true }),
              supabase.from("vw_checked_without_evidence").select("*").eq("year_version", y).limit(999),
            ]);
            return { y, t, c, w };
          })
        );
        if (!mounted) return;

        const totalMap: Record<number, TotalRow | undefined> = {};
        const catsMap: Record<number, CatRow[]> = {};
        const warnsMap: Record<number, WarnRow[]> = {};
        results.forEach(({ y, t, c, w }) => {
          totalMap[y] = (t.data as TotalRow[] | null)?.[0];
          catsMap[y] = ((c.data as CatRow[] | null) || []).map((r) => ({ ...r, category: String(r.category).trim().toLowerCase() }));
          warnsMap[y] = ((w.data as WarnRow[] | null) || []).map((r) => ({ ...r, category: String(r.category).trim().toLowerCase() }));
        });

        setTotal(totalMap);
        setCats(catsMap);
        setWarns(warnsMap);
      } catch (e: any) {
        setErrorMsg(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [uid, year, compareYear]);

  useEffect(() => {
    if (!uid || !availableYears.length) return;
    let mounted = true;
    (async () => {
      try {
        const items = await Promise.all(
          availableYears.map(async (y) => {
            const t = await supabase.rpc("fn_score_total_for_me", { p_year: y, p_require_evidence: true });
            const row = (t.data as TotalRow[] | null)?.[0];
            return { year: y, value: row ? Number(row.total_score) : 0 };
          })
        );
        if (mounted) setTrend(items);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [uid, availableYears]);

  // Derived OwnerOS
  const totalA = total[year];
  const totalB = total[compareYear];
  const radarData = useMemo(() => {
    const a = cats[year] || [];
    const b = cats[compareYear] || [];
    const byA = new Map(a.map((r) => [r.category, r.score]));
    const byB = new Map(b.map((r) => [r.category, r.score]));
    return CAT_ORDER.map((cat) => ({
      category: CAT_LABEL[cat],
      scoreA: Number(byA.get(cat) ?? 0),
      scoreB: Number(byB.get(cat) ?? 0),
    }));
  }, [cats, year, compareYear]);

  const categoryBars = useMemo(() => {
    const a = cats[year] || [];
    const w = warns[year] || [];
    const warnCount = new Map<string, number>();
    w.forEach((x) => warnCount.set(x.category, (warnCount.get(x.category) || 0) + 1));
    return CAT_ORDER.map((cat) => {
      const row = a.find((c) => c.category === cat);
      return {
        key: cat,
        name: CAT_LABEL[cat],
        value: row ? Math.round(toPct(Number(row.score), Math.max(1, Number(row.max_score_category)))) : 0,
        evidenceRate: Number(row?.evidence_rate_pct ?? 0),
        warnings: warnCount.get(cat) || 0,
        raw: row,
      };
    });
  }, [cats, warns, year]);

  const overallScorePct = useMemo(
    () => (totalA ? toPct(Number(totalA.total_score), Math.max(1, Number(totalA.max_score))) : 0),
    [totalA]
  );
  const overallProgressPct = useMemo(() => {
    const a = cats[year] || [];
    if (!a.length) return 0;
    return a.reduce((s, r) => s + Number(r.evidence_rate_pct || 0), 0) / a.length;
  }, [cats, year]);
  const overallHybrid = useMemo(() => Math.round(((overallScorePct * 0.7) + (overallProgressPct * 0.3)) * 10) / 10, [overallScorePct, overallProgressPct]);

  /* ====================== UI ====================== */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-1)]">CEOPolar — Mission Control</h1>
          <div className="flex items-center gap-2 text-sm">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-dark">
              {availableYears.map((y) => (
                <option key={y} value={y}>ปี {y}</option>
              ))}
            </select>
            <span className="muted">เทียบกับ</span>
            <select value={compareYear} onChange={(e) => setCompareYear(Number(e.target.value))} className="input-dark">
              {availableYears.map((y) => (
                <option key={y} value={y}>ปี {y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 btn-success" onClick={() => alert("PDF (mock)")}>
            <Download size={18} /> ดาวน์โหลดรายงาน (PDF)
          </button>
          <button className="inline-flex items-center gap-2 btn-primary" onClick={() => alert("Export (mock)")}>
            <Download size={18} /> Export & Upload
          </button>
        </div>
      </div>

      {/* Sticky Category Bar */}
      <div className="panel-dark p-3 sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/30">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {packs.map((p) => (
            <CategoryChip
              key={p.key}
              active={active === p.key}
              label={p.label}
              color={p.color}
              icon={p.icon}
              brief={p.primary}
              onClick={() => setActive(p.key)}
            />
          ))}
        </div>
      </div>

      {/* Content of Active Category */}
      {packs.map((p) =>
        p.key !== active ? null : (
          <div key={p.key} className="space-y-6">
            {/* Primary KPI */}
            <PrimaryKpiCard pack={p} />
            {/* Secondary Grid + Alerts + Evidence */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8">
                <SecondaryKpiGrid color={p.color} items={p.secondary} />
              </div>
              <div className="xl:col-span-4 space-y-6">
                <AlertsForCategory color={p.color} items={[p.primary, ...p.secondary]} />
                <EvidenceShortcut color={p.color} />
                <MorningReportCard />
              </div>
            </div>
          </div>
        )
      )}

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Insights (OwnerOS) – moved to footer */}
      {errorMsg && <div className="panel-dark p-4 text-red-300 border-red-400/40">เกิดข้อผิดพลาด: {errorMsg}</div>}

      {!loading && (
        <div className="panel-dark">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-sky-400" size={18} />
              <h3 className="panel-title">Radar Chart (ปี {compareYear} vs ปี {year})</h3>
              {total[year] && (
                <span className={`ml-auto text-xs px-3 py-1 rounded-full ${
                  total[year]?.tier_label === "Excellent"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                    : total[year]?.tier_label === "Developing"
                    ? "bg-yellow-500/15 text-yellow-200 border border-yellow-400/30"
                    : "bg-rose-500/15 text-rose-200 border border-rose-400/30"
                }`}>
                  Tier: {thaiTier(total[year]!.tier_label)}
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis />
                <Radar name={`${year}`} dataKey="scoreA" stroke="#16a34a" fill="#16a34a" fillOpacity={0.55} />
                <Radar name={`${compareYear}`} dataKey="scoreB" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.28} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!loading && (
        <div className="panel-dark">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-emerald-400" size={18} />
              <h3 className="panel-title">ความคืบหน้าตามหมวด (ปี {year})</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryBars}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <RBar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!loading && (
        <div className="panel-dark">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="text-purple-400" size={18} />
                <h3 className="panel-title">Progress vs Quality (ปี {year})</h3>
              </div>
              <div className="text-sm muted">
                Score: {fmtPct1(overallScorePct)} · Progress: {fmtPct1(overallProgressPct)}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" domain={[0, 100]} name="Quality (Score%)" />
                <YAxis type="number" dataKey="y" domain={[0, 100]} name="Progress (%)" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <ReferenceLine x={70} stroke="#9ca3af" />
                <ReferenceLine y={80} stroke="#9ca3af" />
                <Scatter name="Org" data={[{ x: clampPct(overallScorePct), y: clampPct(overallProgressPct) }]} fill="#16a34a" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {trend.length > 0 && (
        <div className="panel-dark">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-sky-400" size={18} />
              <h3 className="panel-title">Trend Over Time</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(DashboardPageImpl), { ssr: false });

/* ====================== Local Components ====================== */

function CategoryChip({
  active,
  label,
  color,
  icon: Icon,
  brief,
  onClick,
}: {
  active: boolean;
  label: string;
  color: string;
  icon: LucideIcon;
  brief: KPI;
  onClick: () => void;
}) {
  const dot = active ? "ring-2 ring-white/40" : "opacity-80";
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl text-sm flex items-center gap-2 bg-white/5 hover:bg-white/10 transition ${dot}`}
    >
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: color }}>
        <Icon size={16} className="text-white" />
      </span>
      <span className="font-medium">{label}</span>
      <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 ml-1">
        {brief.label.split(" ")[0]} {renderValue(brief)}
      </span>
    </button>
  );
}

function PrimaryKpiCard({ pack }: { pack: CategoryPack }) {
  const k = pack.primary;
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: statusColor(k.status) }} />
          <div className="panel-title">{pack.label} — Primary KPI</div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs" style={{ background: pack.color + "22", color: "#fff", border: `1px solid ${pack.color}66` }}>
          {k.code.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-3">
        <div className="col-span-12 md:col-span-5">
          <div className="text-sm muted mb-1">{k.label}</div>
          <div className="text-3xl font-extrabold tracking-tight text-white">{renderValue(k)}</div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            {Number.isFinite(k.mom) && (
              <span className={`px-2 py-1 rounded-full border ${Number(k.mom) >= 0 ? "text-emerald-300 border-emerald-400/40" : "text-rose-300 border-rose-400/40"}`}>
                MoM {Number(k.mom) >= 0 ? "+" : ""}
                {fmtPct1(Math.abs(k.mom || 0))}
              </span>
            )}
            {Number.isFinite(k.yoy) && (
              <span className={`px-2 py-1 rounded-full border ${Number(k.yoy) >= 0 ? "text-emerald-300 border-emerald-400/40" : "text-rose-300 border-rose-400/40"}`}>
                YoY {Number(k.yoy) >= 0 ? "+" : ""}
                {fmtPct1(Math.abs(k.yoy || 0))}
              </span>
            )}
          </div>
        </div>
        <div className="col-span-12 md:col-span-7">
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(k.trend || []).map((v, i) => ({ x: i, v }))}>
                <defs>
                  <linearGradient id={`grad-${k.code}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={pack.color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={pack.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={pack.color} fill={`url(#grad-${k.code})`} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button className="btn-primary inline-flex items-center gap-2">
          Assign <ArrowRight size={16} />
        </button>
        <button className="btn-outline inline-flex items-center gap-2">
          เปิดแหล่งข้อมูล <FileText size={16} />
        </button>
      </div>
    </div>
  );
}

function SecondaryKpiGrid({ color, items }: { color: string; items: KPI[] }) {
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 size={18} style={{ color }} />
        <div className="panel-title">Secondary KPIs</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
        {items.map((k) => (
          <div key={k.code} className="panel-dark p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm muted">{k.label}</div>
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: statusColor(k.status) }} />
            </div>
            <div className="text-xl font-semibold text-white mt-1">{renderValue(k)}</div>
            {k.trend && (
              <div className="h-[54px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={k.trend.map((v, i) => ({ x: i, v }))}>
                    <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.12} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsForCategory({ color, items }: { color: string; items: KPI[] }) {
  const alerts = items.filter((k) => k.status !== "green");
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={18} style={{ color }} />
        <div className="panel-title">Alerts & Risks</div>
      </div>
      {alerts.length ? (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.code} className="panel-dark p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: statusColor(a.status) }} />
                <div>
                  <div className="font-medium text-[var(--text-1)]">{a.label}</div>
                  <div className="text-xs muted">{renderValue(a)}</div>
                </div>
              </div>
              <button className="text-sm text-[var(--accent-astroBlue)] hover:underline inline-flex items-center gap-1">
                Assign <ArrowRight size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm muted">ไม่มีความเสี่ยงสำคัญ</div>
      )}
    </div>
  );
}

function EvidenceShortcut({ color }: { color: string }) {
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck size={18} style={{ color }} />
        <div className="panel-title">Evidence & Checklist</div>
      </div>
      <div className="text-sm muted">อัปเดตหลักฐาน/เช็กลิสต์ของหมวดนี้เพื่อดันคะแนน Execution</div>
      <div className="mt-3">
        <Link href={`/checklist`} className="btn-primary inline-flex items-center gap-2">
          ไปที่ Checklist <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function MorningReportCard() {
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center gap-2">
        <Clock className="text-sky-400" size={18} />
        <div className="panel-title">Morning Report</div>
      </div>
      <div className="mt-2 text-sm space-y-1">
        <div>เวลา: <b>08:30</b> (จ–ศ)</div>
        <div>เนื้อหา: Primary x7 + เหตุผิดปกติ</div>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="btn-primary inline-flex items-center gap-2">ส่งตอนนี้ <ArrowRight size={16} /></button>
        <button className="btn-outline inline-flex items-center gap-2">ตั้งค่า</button>
      </div>
    </div>
  );
}

/* ====================== Shared tiny utils ====================== */

function statusColor(s: KPI["status"]) {
  return s === "green" ? "#10B981" : s === "amber" ? "#F59E0B" : "#F43F5E";
}
function renderValue(k: KPI) {
  switch (k.unit) {
    case "THB":
      return `฿ ${fmtMoney2(k.value)}`;
    case "PCT":
      return fmtPct2(k.value);
    case "DAYS":
      return `${k.value.toLocaleString()} วัน`;
    default:
      return k.value.toLocaleString();
  }
}
