// /src/pages/dashboard.tsx – CEOPolar Mission Control (MVP v3.0)

import posthog from "posthog-js";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar as RBar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ReferenceLine,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Target,
  BarChart3,
  Activity,
  TrendingUp,
  Lightbulb,
  Building2,
  Users,
  Wallet,
  ShoppingCart,
  Sparkles,
  Clock,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/utils/supabaseClient";

/** ---------- Types (OwnerOS section) ---------- */
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

/** ---------- Types (Mission Control: KPI) ---------- */
type KPIKey =
  | "revenue"
  | "cash"
  | "runway"
  | "arOver30"
  | "apOver30"
  | "gm"
  | "nps"
  | "retention"
  | "turnover"
  | "inventory";

type KpiUnit = "THB" | "DAYS" | "PCT" | "COUNT" | "SCORE";

type KPI = {
  key: KPIKey;
  label: string;
  value: number;
  unit: KpiUnit;
  trend?: number[]; // สำหรับ sparkline
  mom?: number | null;
  yoy?: number | null;
  status: "green" | "amber" | "red";
  note?: string | null;
};

type GoalItem = {
  id: string;
  title: string;
  owner: string;
  target: string;
  due: string; // YYYY-MM-DD
  progress: number; // 0-100
  status: "ontrack" | "atrisk" | "offtrack";
};

/** ---------- Constants ---------- */
const CAT_LABEL: Record<CategoryKey, string> = {
  strategy: "Strategy",
  structure: "Org Structure",
  sop: "SOP",
  hr: "HR",
  finance: "Finance",
  sales: "Sales",
};
const CAT_ORDER: CategoryKey[] = ["strategy", "structure", "sop", "hr", "finance", "sales"];

// สีแถบหัวการ์ดรายหมวด (OwnerOS insight)
const COLOR: Record<CategoryKey, string> = {
  strategy: "#2563eb",
  structure: "#a855f7",
  sop: "#f59e0b",
  hr: "#ec4899",
  finance: "#16a34a",
  sales: "#f59e0b",
};

// ฟังก์ชัน G/A/R ตั้งต้นสำหรับ KPI
const trafficOf = {
  runway: (v: number) => (v >= 90 ? "green" : v >= 45 ? "amber" : "red"),
  revenueYoY: (v: number) => (v >= 15 ? "green" : v >= 5 ? "amber" : "red"),
  arDays: (v: number) => (v <= 45 ? "green" : v <= 60 ? "amber" : "red"),
  turnover: (v: number) => (v <= 12 ? "green" : v <= 18 ? "amber" : "red"),
} as const;

/** ---------- Helpers ---------- */
const clampPct = (v: number) => Math.max(0, Math.min(100, v));
const fmtPct0 = (v: number) =>
  `${clampPct(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%`;
const fmtPct1 = (v: number) =>
  `${clampPct(v).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const fmtPct2 = (v: number) =>
  `${clampPct(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
const toPct = (n: number, d: number) => (d ? (Number(n) / Number(d)) * 100 : 0);

const fmtMoney2 = (v: number) =>
  v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const thaiTier = (t: TotalRow["tier_label"]) =>
  t === "Excellent" ? "Excellent" : t === "Developing" ? "Developing" : "Early Stage";

/** ---------- Mock Data Generators (KPI/Goals) ---------- */
// ปรับง่ายสำหรับ MVP: ต่อ API/Sheets ภายหลัง
function useMockKpi(): KPI[] {
  const now = new Date();
  const seed = (n: number) => Math.sin(n * 1.37) * 0.5 + 0.5;

  const spark = (base: number, vol = 0.06) =>
    Array.from({ length: 24 }).map((_, i) => base * (1 + (seed(i + now.getDate()) - 0.5) * vol * 2));

  const revenueVal = 1250000;
  const revenueYoY = 18; // %
  const gm = 28; // %
  const nps = 52; // %
  const retention = 86; // %
  const turnover = 10; // %
  const runway = 78; // days
  const ar30 = 505000;
  const ap30 = 325000;
  const inventory = 42; // days

  return [
    {
      key: "revenue",
      label: "รายได้เดือนนี้",
      value: revenueVal,
      unit: "THB",
      trend: spark(revenueVal, 0.1),
      mom: 12,
      yoy: revenueYoY,
      status: trafficOf.revenueYoY(revenueYoY),
    },
    {
      key: "cash",
      label: "เงินสดคงเหลือ",
      value: 820000,
      unit: "THB",
      trend: spark(820000, 0.04),
      status: runway >= 90 ? "green" : runway >= 45 ? "amber" : "red",
    },
    { key: "runway", label: "Runway (วัน)", value: runway, unit: "DAYS", status: trafficOf.runway(runway) },
    { key: "arOver30", label: "AR > 30 วัน", value: ar30, unit: "THB", status: ar30 <= 400000 ? "green" : ar30 <= 600000 ? "amber" : "red" },
    { key: "apOver30", label: "AP > 30 วัน", value: ap30, unit: "THB", status: ap30 <= 300000 ? "green" : ap30 <= 450000 ? "amber" : "red" },
    { key: "gm", label: "กำไรขั้นต้น (GM%)", value: gm, unit: "PCT", status: gm >= 30 ? "green" : gm >= 25 ? "amber" : "red" },
    { key: "nps", label: "NPS", value: nps, unit: "PCT", status: nps >= 50 ? "green" : nps >= 30 ? "amber" : "red" },
    {
      key: "turnover",
      label: "อัตราลาออก (ปี)",
      value: turnover,
      unit: "PCT",
      status: trafficOf.turnover(turnover),
    },
    { key: "inventory", label: "Inventory Days", value: inventory, unit: "DAYS", status: inventory <= 45 ? "green" : inventory <= 60 ? "amber" : "red" },
  ];
}

function useMockGoals(): GoalItem[] {
  const q = new Date().getMonth() <= 2 ? "Q1" : new Date().getMonth() <= 5 ? "Q2" : new Date().getMonth() <= 8 ? "Q3" : "Q4";
  return [
    { id: "g1", title: `${q}: GM% ≥ 28%`, owner: "CFO", target: "≥ 28%", due: "2025-09-30", progress: 62, status: "ontrack" },
    { id: "g2", title: `${q}: AR Days ≤ 45 วัน`, owner: "Finance Lead", target: "≤ 45d", due: "2025-09-30", progress: 41, status: "atrisk" },
    { id: "g3", title: `${q}: NPS ≥ 50`, owner: "Head of CX", target: "≥ 50", due: "2025-09-30", progress: 55, status: "ontrack" },
  ];
}

/** ---------- Component ---------- */
function DashboardPageImpl() {
  const { profile } = useUserProfile();
  const uid = (profile as any)?.id || null;
  const companyName = profile?.company_name || "CEOPolar";

  const thisYear = new Date().getFullYear();
  const [availableYears, setAvailableYears] = useState<number[]>([thisYear]);
  const [year, setYear] = useState<number>(thisYear);
  const [compareYear, setCompareYear] = useState<number>(thisYear - 1);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [total, setTotal] = useState<Record<number, TotalRow | undefined>>({});
  const [cats, setCats] = useState<Record<number, CatRow[]>>({});
  const [warns, setWarns] = useState<Record<number, WarnRow[]>>({});
  const [industryAvg, setIndustryAvg] = useState<Record<number, IndustryAvgRow | undefined>>({});
  const [trend, setTrend] = useState<Array<{ year: number; value: number }>>([]);

  // ===== KPI & Goals (MVP mock) =====
  const kpis = useMockKpi();
  const goals = useMockGoals();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      posthog?.capture("Dashboard Viewed", { section: "mission_control", year, compareYear });
    } catch {}
  }, [year, compareYear]);

  // โหลดปี
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.rpc("fn_available_years_for_me");
      if (!mounted) return;
      if (error || !data?.length) {
        setAvailableYears([thisYear]);
        setYear(thisYear);
        setCompareYear(thisYear - 1);
        return;
      }
      const years = data
        .map((r: any) => Number(r.year_version))
        .filter(Boolean)
        .sort((a: number, b: number) => a - b);
      setAvailableYears(years);
      setYear(years[years.length - 1]);
      setCompareYear(years.length > 1 ? years[years.length - 2] : years[0]);
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  // ป้องกันปีซ้ำ
  useEffect(() => {
    if (year === compareYear && availableYears.length > 1) {
      const alt = availableYears.find((y) => y !== year)!;
      setCompareYear(alt);
    }
  }, [year, compareYear, availableYears]);

  // โหลดข้อมูล OwnerOS (สำหรับ Execution Health / Insights)
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
            const [t, c, w, ind] = await Promise.all([
              supabase.rpc("fn_score_total_for_me", { p_year: y, p_require_evidence: true }),
              supabase.rpc("fn_score_by_category_for_me", { p_year: y, p_require_evidence: true }),
              supabase.from("vw_checked_without_evidence").select("*").eq("year_version", y).limit(999),
              supabase.rpc("fn_industry_avg_for_me", { p_year: y, p_require_evidence: true }),
            ]);
            return { y, t, c, w, ind };
          })
        );

        if (!mounted) return;
        const totalMap: Record<number, TotalRow | undefined> = {};
        const catsMap: Record<number, CatRow[]> = {};
        const warnsMap: Record<number, WarnRow[]> = {};
        const indMap: Record<number, IndustryAvgRow | undefined> = {};

        results.forEach(({ y, t, c, w, ind }) => {
          totalMap[y] = (t.data as TotalRow[] | null)?.[0];
          catsMap[y] = ((c.data as CatRow[] | null) || []).map((r) => ({
            ...r,
            category: String(r.category).trim().toLowerCase(),
          }));
          warnsMap[y] = ((w.data as WarnRow[] | null) || []).map((r) => ({
            ...r,
            category: String(r.category).trim().toLowerCase(),
          }));
          indMap[y] = (ind.data as IndustryAvgRow[] | null)?.[0];
        });

        setTotal(totalMap);
        setCats(catsMap);
        setWarns(warnsMap);
        setIndustryAvg(indMap);
      } catch (e: any) {
        console.error(e);
        setErrorMsg(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [uid, year, compareYear]);

  // โหลด trend
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
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid, availableYears]);

  /** ===== Derived Data (OwnerOS Insight) ===== */
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

  const overallHybrid = useMemo(
    () => Math.round(((overallScorePct * 0.7) + (overallProgressPct * 0.3)) * 10) / 10,
    [overallScorePct, overallProgressPct]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loading) return;
    try {
      posthog?.capture("Score Recomputed", { year, overallHybrid, overallScorePct, overallProgressPct });
    } catch {}
  }, [loading, year, overallHybrid, overallScorePct, overallProgressPct]);

  const gradeInfo = useMemo(() => toGrade(overallHybrid), [overallHybrid]);
  const quadrantPoint = useMemo(
    () => [{ x: clampPct(overallScorePct), y: clampPct(overallProgressPct) }],
    [overallScorePct, overallProgressPct]
  );
  const topGaps = useMemo(
    () =>
      (warns[year] || [])
        .slice(0, 3)
        .map((w) => ({ title: w.name, category: String(w.category).toUpperCase(), id: w.checklist_id })),
    [warns, year]
  );

  const addonSuggestions = useMemo(() => {
    const list: Array<{ title: string; desc: string; href: string }> = [];
    const byKey: Record<string, number> = {};
    categoryBars.forEach((b) => (byKey[b.key] = b.evidenceRate));
    if ((byKey["sop"] ?? 100) < 60)
      list.push({
        title: "Policy & SOP Acknowledgement",
        desc: "เก็บนโยบาย/คู่มือ + บันทึกการอ่าน/ยอมรับ เพื่อดัน Evidence",
        href: "/modules/policy",
      });
    if ((byKey["finance"] ?? 100) < 60)
      list.push({
        title: "River KPI",
        desc: "Dashboard KPI รายเดือน + Budget vs Actual",
        href: "/modules/river-kpi",
      });
    if ((byKey["strategy"] ?? 100) < 60)
      list.push({
        title: "Goal Execution Tracker",
        desc: "ปักเป้าหมายรายหมวด + ติดตาม % บรรลุ",
        href: "/modules/goal",
      });
    if ((byKey["structure"] ?? 100) < 60)
      list.push({
        title: "Risk Register",
        desc: "บริหารความเสี่ยง L×I + DOA/CoI/Whistleblowing",
        href: "/modules/risk",
      });
    if (!list.length)
      list.push({
        title: "Filing Module (IPO/Prospectus)",
        desc: "รวมหลักฐานสร้าง Binder พร้อมยื่น/นักลงทุน",
        href: "/modules/filing",
      });
    return list.slice(0, 2);
  }, [categoryBars]);

  /** ---------- Export Binder ---------- */
  const handleExport = async (uploadToStorage = false) => {
    if (!uid) return;
    try {
      try {
        posthog?.capture("Export Binder", { year, uploadToStorage, companyName });
      } catch {}
      const params = new URLSearchParams({
        userId: uid,
        year: String(year),
        companyName,
        upload: uploadToStorage ? "1" : "0",
      });
      const url = `/api/export/export-binder?${params.toString()}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      if (uploadToStorage) {
        const j = await res.json();
        if (j?.url) window.open(j.url, "_blank");
        else alert("Export เสร็จ แต่ไม่ได้ลิงก์ไฟล์");
        try {
          posthog?.capture("Export Binder Result", { year, uploadToStorage: true, ok: true });
        } catch {}
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Binder_${companyName.replace(/[^A-Za-z0-9\\-]+/g, "_")}_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      try {
        posthog?.capture("Export Binder Result", { year, uploadToStorage: false, ok: true });
      } catch {}
    } catch (e: any) {
      console.error(e);
      alert("Export ไม่สำเร็จ: " + (e?.message || "unknown"));
      try {
        posthog?.capture("Export Binder Error", { year, uploadToStorage, message: e?.message || String(e) });
      } catch {}
    }
  };

  /** ---------- UI ---------- */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-1)]">CEOPolar – Mission Control</h1>
          <div className="flex items-center gap-2 text-sm">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-dark">
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
              ))}
            </select>
            <span className="muted">เทียบกับ</span>
            <select value={compareYear} onChange={(e) => setCompareYear(Number(e.target.value))} className="input-dark">
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 btn-success" onClick={() => handleExport(false)}>
            <Download size={18} /> ดาวน์โหลดรายงาน (XLSX)
          </button>
          <button className="inline-flex items-center gap-2 btn-primary" onClick={() => handleExport(true)}>
            <Download size={18} /> Export & Upload
          </button>
        </div>
      </div>

      {/* ========== TOP: North-Star KPIs + Morning Report ========== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* KPI Grid (xl: span 9) */}
        <div className="xl:col-span-9">
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
            {kpis.slice(0, 8).map((k) => (
              <KpiCard key={k.key} k={k} />
            ))}
          </div>
        </div>

        {/* Morning Report (xl: span 3) */}
        <div className="xl:col-span-3">
          <MorningReportCard />
        </div>
      </div>

      {/* ========== Middle: Goals + Alerts (Left) | Execution Health + Strategy + Download (Right) ========== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left */}
        <div className="xl:col-span-7 space-y-6">
          <GoalsTracker goals={goals} />
          <AlertsPanel kpis={kpis} />
        </div>

        {/* Right */}
        <div className="xl:col-span-5 space-y-6">
          <ExecutionHealthMini
            overallScorePct={overallScorePct}
            overallProgressPct={overallProgressPct}
            overallHybrid={overallHybrid}
            gradeInfo={gradeInfo}
            warnCount={(warns[year] || []).length}
            year={year}
          />
          <StrategyQuickActions />
          <DataSourceStatus />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* ========== Insights (OwnerOS blocks moved down) ========== */}
      {!loading && (
        <div className="panel-dark">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-sky-400" size={18} />
              <h3 className="panel-title">Radar Chart (ปี {compareYear} vs ปี {year})</h3>
              {total[year] && (
                <span
                  className={`ml-auto text-xs px-3 py-1 rounded-full ${
                    total[year]?.tier_label === "Excellent"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30"
                      : total[year]?.tier_label === "Developing"
                      ? "bg-yellow-500/15 text-yellow-200 border border-yellow-400/30"
                      : "bg-rose-500/15 text-rose-200 border border-rose-400/30"
                  }`}
                >
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

            {/* Mini bar overview */}
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryBars}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <RBar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {categoryBars.map((item) => {
                const Icon =
                  item.key === "strategy"
                    ? Target
                    : item.key === "structure"
                    ? Building2
                    : item.key === "sop"
                    ? ShoppingCart
                    : item.key === "hr"
                    ? Users
                    : item.key === "finance"
                    ? Wallet
                    : ShoppingCart;

                return (
                  <div key={item.key} className="panel-dark overflow-hidden">
                    <div className="px-4 py-2 text-white font-semibold flex items-center gap-2" style={{ background: COLOR[item.key as CategoryKey] }}>
                      <Icon size={16} /> {item.name}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="muted">Progress</span>
                        <span className="metric-contrast">{fmtPct0(item.value)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="muted">Evidence Rate</span>
                        <span className="font-medium text-[var(--text-2)]">{fmtPct0(item.evidenceRate)}</span>
                      </div>

                      {item.raw?.max_score_category === 0 ? (
                        <div className="text-xs text-rose-300">ยังไม่ได้ตั้งคะแนนใน template</div>
                      ) : item.warnings > 0 ? (
                        <div className="text-xs text-yellow-200 flex items-center gap-1">
                          <AlertTriangle size={14} /> หลักฐานไม่ครบ {item.warnings} รายการ
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={14} /> หลักฐานครบ
                        </div>
                      )}

                      <div className="pt-2">
                        <Link
                          href={`/checklist?tab=${item.key}&year=${year}`}
                          className="text-sm text-[var(--accent-astroBlue)] hover:underline flex items-center gap-1"
                        >
                          View Details <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Progress vs Quality */}
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
                <Scatter name="Org" data={quadrantPoint} fill="#16a34a" />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 text-xs muted mt-2">
              <div className="p-1">🚧 Early Stage</div>
              <div className="p-1">⚠️ Quality Uplift</div>
              <div className="p-1">⏳ Quick Wins</div>
              <div className="p-1">✅ Ready</div>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="panel-dark">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="text-amber-300" size={18} />
            <h3 className="panel-title">Suggestions (Add-on)</h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {addonSuggestions.map((s, idx) => (
              <li key={idx} className="panel-dark p-3">
                <div className="font-medium text-[var(--text-1)]">{s.title}</div>
                <div className="text-xs muted mb-2">{s.desc}</div>
                <Link href={s.href} className="text-sm text-[var(--accent-astroBlue)] hover:underline flex items-center gap-1">
                  ดูรายละเอียด <ArrowRight size={14} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Trend */}
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

/** ---------- Local UI sub-components (Mission Control) ---------- */

function KpiCard({ k }: { k: KPI }) {
  // สีสถานะ
  const color =
    k.status === "green" ? "text-emerald-300" : k.status === "amber" ? "text-amber-300" : "text-rose-300";
  const dot =
    k.status === "green" ? "bg-emerald-400/90" : k.status === "amber" ? "bg-amber-400/90" : "bg-rose-400/90";

  const unitText =
    k.unit === "THB"
      ? "฿"
      : k.unit === "PCT"
      ? "%"
      : k.unit === "DAYS"
      ? "วัน"
      : k.unit === "COUNT"
      ? ""
      : "";

  // แสดงผลตามหน่วย พร้อมทศนิยม 2 ตำแหน่ง
  const renderValue = () => {
    if (k.unit === "THB") return `฿ ${fmtMoney2(k.value)}`;
    if (k.unit === "PCT") return fmtPct2(k.value);
    return `${k.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unitText ? " " + unitText : ""}`;
  };

  // icon แนะนำ
  const Icon =
    k.key === "revenue"
      ? Sparkles
      : k.key === "cash" || k.key === "apOver30"
      ? Wallet
      : k.key === "runway"
      ? Clock
      : k.key === "arOver30"
      ? FileText
      : k.key === "gm"
      ? BarChart3
      : k.key === "nps" || k.key === "retention"
      ? ShieldCheck
      : k.key === "turnover"
      ? Users
      : ShoppingCart;

  return (
    <div className="panel-dark p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${dot}`} />
          <div className="font-medium text-[var(--text-1)]">{k.label}</div>
        </div>
        <Icon size={16} className="text-white/60" />
      </div>

      <div className="mt-2 text-2xl font-extrabold text-white tracking-tight">{renderValue()}</div>

      {/* Sparkline */}
      {k.trend && k.trend.length > 0 && (
        <div className="mt-3 h-[58px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={k.trend.map((v, i) => ({ x: i, v }))}>
              <defs>
                <linearGradient id={`grad-${k.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(14,165,233,0.9)" />
                  <stop offset="100%" stopColor="rgba(14,165,233,0.0)" />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="#0ea5e9" fill={`url(#grad-${k.key})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Change badges */}
      {(Number.isFinite(k.mom) || Number.isFinite(k.yoy)) && (
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
          <span className={`ml-auto text-xs ${color}`}>• {k.status.toUpperCase()}</span>
        </div>
      )}
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
        <div>เนื้อหา: Sales, Cash/Runway, AR/AP, ข้อผิดปกติ</div>
      </div>
      <div className="mt-3 flex gap-2">
        <button className="btn-primary inline-flex items-center gap-2">
          ส่งตอนนี้ <ArrowRight size={16} />
        </button>
        <button className="btn-outline inline-flex items-center gap-2">
          แก้ไขรายการ
        </button>
      </div>
    </div>
  );
}

function GoalsTracker({ goals }: { goals: GoalItem[] }) {
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <Target className="text-emerald-400" size={18} />
        <div className="panel-title">Quarter Goals</div>
      </div>
      <ul className="space-y-3">
        {goals.map((g) => (
          <li key={g.id} className="panel-dark p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[var(--text-1)]">{g.title}</div>
                <div className="text-xs muted">Owner: {g.owner} • Target: {g.target} • Due: {g.due}</div>
              </div>
              <StatusPill status={g.status} />
            </div>
            <div className="mt-2">
              <StatBar label="Progress" value={g.progress} colorClass={g.status === "ontrack" ? "progress-quality" : g.status === "atrisk" ? "progress-completion" : "bg-rose-500"} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlertsPanel({ kpis }: { kpis: KPI[] }) {
  const alerts = kpis
    .filter((k) => k.status !== "green")
    .map((k) => ({
      id: k.key,
      title:
        k.key === "runway"
          ? "Runway ต่ำกว่าเกณฑ์"
          : k.key === "arOver30"
          ? "ลูกหนี้เกินกำหนดสูง"
          : k.key === "apOver30"
          ? "เจ้าหนี้ค้างชำระ"
          : k.key === "gm"
          ? "GM% ต่ำกว่าเป้า"
          : k.key === "nps"
          ? "NPS ต่ำกว่าเกณฑ์"
          : k.key === "turnover"
          ? "อัตราลาออกสูง"
          : "KPI เสี่ยง",
      level: k.status,
      k,
    }));

  return (
    <div className="panel-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="text-rose-400" size={18} />
        <div className="panel-title">Alerts & Risks</div>
      </div>
      {alerts.length ? (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="panel-dark p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    a.level === "red" ? "bg-rose-400/90" : "bg-amber-400/90"
                  }`}
                />
                <div>
                  <div className="font-medium text-[var(--text-1)]">{a.title}</div>
                  <div className="text-xs muted">{a.k.label}: {a.k.unit === "THB" ? "฿ " + fmtMoney2(a.k.value) : a.k.unit === "PCT" ? fmtPct2(a.k.value) : a.k.value.toLocaleString()} </div>
                </div>
              </div>
              <Link href={`/checklist?year=${new Date().getFullYear()}`} className="text-sm text-[var(--accent-astroBlue)] hover:underline flex items-center gap-1">
                Assign to team <ArrowRight size={14} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm muted">ไม่มีความเสี่ยงสำคัญ</div>
      )}
    </div>
  );
}

function ExecutionHealthMini({
  overallScorePct,
  overallProgressPct,
  overallHybrid,
  gradeInfo,
  warnCount,
  year,
}: {
  overallScorePct: number;
  overallProgressPct: number;
  overallHybrid: number;
  gradeInfo: { grade: string; message: string; color: string; hex: string };
  warnCount: number;
  year: number;
}) {
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="text-teal-300" size={18} />
        <div className="panel-title">Execution Health (OwnerOS)</div>
        <GradeBadge label={gradeInfo.grade} colorClass={gradeInfo.color} />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-5 flex items-center justify-center">
          <CircularGauge value={overallHybrid} trackColor="rgba(255,255,255,.16)" barColor={gradeInfo.hex} size={120} strokeWidth={12} />
        </div>
        <div className="col-span-12 sm:col-span-7">
          <div className="leading-tight">
            <span className="score-on-dark">{format1(overallHybrid)}</span>
            <span className="score-on-dark-suffix"> / 100</span>
          </div>
          <div className="mt-1 text-sm muted">Hybrid = 70% Score + 30% Progress</div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <StatBar label="Score (คุณภาพ)" value={overallScorePct} colorClass="progress-quality" />
            <StatBar label="Progress (ความครบถ้วน)" value={overallProgressPct} colorClass="progress-completion" />
          </div>
          <div className="mt-3 text-xs muted">หลักฐานขาด {warnCount} รายการ</div>
          <div className="mt-2">
            <Link href={`/checklist?year=${year}`} className="text-sm text-[var(--accent-astroBlue)] hover:underline inline-flex items-center gap-1">
              ไปจัดการเอกสาร <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategyQuickActions() {
  const items = [
    { title: "Cost Leadership", href: "/playbooks/cost", icon: Wallet },
    { title: "Lean / Kaizen", href: "/playbooks/lean", icon: Activity },
    { title: "Digital Adoption", href: "/playbooks/digital", icon: Sparkles },
  ] as const;

  return (
    <div className="panel-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="text-amber-300" size={18} />
        <div className="panel-title">Strategy Choice</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((x) => (
          <Link
            key={x.title}
            href={x.href}
            className="panel-dark p-3 hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <x.icon size={18} className="text-white/70" />
            <div className="font-medium">{x.title}</div>
          </Link>
        ))}
      </div>
      <div className="mt-3">
        <button className="btn-primary inline-flex items-center gap-2">
          เริ่มแผน 30–60–90 วัน <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function DataSourceStatus() {
  const rows = [
    { name: "Accounting/ERP", status: "connected", lastSync: "วันนี้ 07:55" },
    { name: "CRM/POS", status: "disconnected", lastSync: "-" },
    { name: "Google Sheet", status: "connected", lastSync: "วันนี้ 07:58" },
  ] as const;
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="text-emerald-300" size={18} />
        <div className="panel-title">Data Sources & Sync</div>
      </div>
      <ul className="space-y-2 text-sm">
        {rows.map((r, idx) => (
          <li key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  r.status === "connected" ? "bg-emerald-400/90" : "bg-rose-400/90"
                }`}
              />
              <span>{r.name}</span>
            </div>
            <span className="muted">ล่าสุด: {r.lastSync}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <button className="btn-outline">Reconnect</button>
      </div>
    </div>
  );
}

/** ---------- Local UI utilities (shared) ---------- */

function StatBar({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  const v = clampPct(value);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="muted">{label}</span>
        <span className="metric-contrast">{fmtPct1(v)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden progress-track">
        <div className={`h-full ${colorClass}`} style={{ width: `${v}%`, borderRadius: 999 }} />
      </div>
    </div>
  );
}

function CircularGauge({
  value,
  trackColor = "rgba(255,255,255,.16)",
  barColor = "#10b981",
  size = 128,
  strokeWidth = 12,
}: {
  value: number;
  trackColor?: string;
  barColor?: string;
  size?: number;
  strokeWidth?: number;
}) {
  const v = clampPct(value);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        {/* Track */}
        <circle cx={center} cy={center} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {/* Bar */}
        <circle
          cx={center}
          cy={center}
          r={r}
          stroke={barColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-500"
        />
      </svg>
      {/* Overlay number (readable on dark) */}
      <div className="donut-center-contrast">
        <div className="text-center leading-tight">
          <div className="font-extrabold">{fmtPct1(v)}</div>
          <div className="text-xs metric-contrast-sub">/ 100</div>
        </div>
      </div>
    </div>
  );
}

function GradeBadge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <div className={`inline-flex items-center rounded-xl px-2.5 py-1.5 text-sm font-semibold text-white ${colorClass}`}>
      <span className="mr-1">🎓</span>
      {label}
    </div>
  );
}

function StatusPill({ status }: { status: GoalItem["status"] }) {
  const map = {
    ontrack: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30",
    atrisk: "bg-amber-500/15 text-amber-200 border border-amber-400/30",
    offtrack: "bg-rose-500/15 text-rose-200 border border-rose-400/30",
  } as const;
  const label = status === "ontrack" ? "On track" : status === "atrisk" ? "At risk" : "Off track";
  return <span className={`px-2.5 py-1 rounded-full text-xs ${map[status]}`}>{label}</span>;
}

/** ---------- Helpers (format & grade) ---------- */
function format1(n: number) {
  return Number.isFinite(n) ? (Math.round(n * 10) / 10).toString() : "0";
}
function toGrade(score0to100: number): { grade: string; message: string; color: string; hex: string } {
  const s = clampPct(score0to100);
  if (s >= 90) return { grade: "A", message: "ยอดเยี่ยมมาก • พร้อมขยายตัว", color: "bg-gradient-to-r from-emerald-500 to-emerald-600", hex: "#10b981" };
  if (s >= 80) return { grade: "B+", message: "แข็งแรง • เหลือเก็บรายละเอียด", color: "bg-gradient-to-r from-teal-500 to-sky-600", hex: "#14b8a6" };
  if (s >= 70) return { grade: "B", message: "ดี • มีพื้นฐานครบ ควรเสริมบางจุด", color: "bg-gradient-to-r from-sky-500 to-blue-600", hex: "#0ea5e9" };
  if (s >= 62) return { grade: "C", message: "เริ่มมีระบบแล้ว • ค่อย ๆ อัปเกรดต่อ", color: "bg-gradient-to-r from-amber-400 to-amber-500", hex: "#f59e0b" };
  if (s >= 50) return { grade: "D", message: "ช่วงวางรากฐาน • ก้าวแรกที่ดี", color: "bg-gradient-to-r from-rose-400 to-rose-500", hex: "#fb7185" };
  return { grade: "E", message: "กำลังเริ่มต้น • ยังมีโอกาสโตอีกเยอะ", color: "bg-gradient-to-r from-rose-500 to-rose-600", hex: "#f43f5e" };
}
