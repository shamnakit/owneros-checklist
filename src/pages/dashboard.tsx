// /src/pages/dashboard.tsx — CEOPolar Mission Control (Executive Dashboard)

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
  Leaf,
  FileText,
  Download,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/utils/supabaseClient";
import { getSalesMtd, getArOver30, getNpsThisMonth } from "@/lib/kpis";

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
  color: string; // ใช้ var(--accent) ผูกกับธีม
  icon: LucideIcon;
  primary: KPI;
  secondary: KPI[];
};

/** ---------- OwnerOS types (insights) ---------- */
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
type WarnRow = {
  category: CategoryKey | string;
  checklist_id: string;
  name: string;
};

/* ====================== Helpers ====================== */
const clampPct = (v: number) => Math.max(0, Math.min(100, v));
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

  // ✅ ใช้สีจากธีมทั้งระบบ
  const ACCENT = "var(--accent)";

  return [
    {
      key: "financial",
      label: "Financial",
      color: ACCENT,
      icon: Wallet,
      primary: { code: "runway", label: "Cash & Runway (วัน)", unit: "DAYS", value: runway, trend: randSpark(75, 0.04), status: traffic.runway(runway) },
      secondary: [
        { code: "revenue", label: "Sales MTD (฿)", unit: "THB", value: 1_250_000, trend: randSpark(1_200_000, 0.12), mom: 12, yoy: revenueYoY, status: traffic.revenueYoY(revenueYoY) },
        { code: "gm", label: "GM%", unit: "PCT", value: gm, status: traffic.gm(gm) },
        { code: "arOver30", label: "AR >30 (฿)", unit: "THB", value: ar30, status: ar30 <= 400000 ? "green" : ar30 <= 600000 ? "amber" : "red" },
        { code: "apOver30", label: "AP >30 (฿)", unit: "THB", value: ap30, status: ap30 <= 300000 ? "green" : ap30 <= 450000 ? "amber" : "red" },
        { code: "inventoryDays", label: "Inventory Days", unit: "DAYS", value: inventory, status: traffic.inventoryDays(inventory) },
      ],
    },
    {
      key: "customer",
      label: "Customer",
      color: ACCENT,
      icon: Users,
      primary: { code: "retention", label: "Retention Rate", unit: "PCT", value: retention, trend: randSpark(86, 0.02), status: traffic.retention(retention) },
      secondary: [
        { code: "nps", label: "NPS", unit: "PCT", value: nps, status: traffic.nps(nps) },
        { code: "cac", label: "CAC (฿)", unit: "THB", value: 950, status: "amber" },
        { code: "clv", label: "CLV (฿)", unit: "THB", value: 18_500, status: "green" },
      ],
    },
    {
      key: "people",
      label: "People",
      color: ACCENT,
      icon: UserCircle2,
      primary: { code: "turnover", label: "Turnover (ปี%)", unit: "PCT", value: turnover, trend: randSpark(11, 0.06), status: traffic.turnover(turnover) },
      secondary: [
        { code: "engagement", label: "Engage", unit: "PCT", value: 76, status: "green" },
        { code: "vacancy", label: "Vacancy", unit: "PCT", value: 3.2, status: "green" },
        { code: "tth", label: "Time-to-Hire", unit: "DAYS", value: 22, status: "amber" },
      ],
    },
    {
      key: "operational",
      label: "Operational",
      color: ACCENT,
      icon: Activity,
      primary: { code: "oft", label: "Fulfillment Time (วัน)", unit: "DAYS", value: 3.6, trend: randSpark(3.8, 0.1), status: "green" },
      secondary: [
        { code: "rpe", label: "Rev/Emp (฿)", unit: "THB", value: 385_000, status: "green" },
        { code: "defect", label: "Defect", unit: "PCT", value: 0.9, status: "green" },
        { code: "otd", label: "On-time", unit: "PCT", value: 94, status: "green" },
      ],
    },
    {
      key: "strategy",
      label: "Strategy & Market",
      color: ACCENT,
      icon: Target,
      primary: { code: "mshare", label: "Market Share", unit: "PCT", value: 8.4, trend: randSpark(8.1, 0.08), status: "green" },
      secondary: [
        { code: "ttm", label: "Time-to-Market", unit: "DAYS", value: 58, status: "amber" },
        { code: "winrate", label: "Win Rate", unit: "PCT", value: 28, status: "amber" },
        { code: "pipeline", label: "Pipeline (x)", unit: "COUNT", value: 2.9, status: "green" },
      ],
    },
    {
      key: "innovation",
      label: "Innovation",
      color: ACCENT,
      icon: Sparkles,
      primary: { code: "newrev", label: "New Product Rev", unit: "PCT", value: 17, trend: randSpark(16, 0.08), status: "green" },
      secondary: [
        { code: "rnd", label: "R&D/Rev", unit: "PCT", value: 6.2, status: "green" },
        { code: "ideas", label: "Ideas (#)", unit: "COUNT", value: 28, status: "green" },
        { code: "t2proto", label: "Time-to-Proto", unit: "DAYS", value: 21, status: "green" },
      ],
    },
    {
      key: "esg",
      label: "ESG",
      color: ACCENT,
      icon: Leaf,
      primary: { code: "ghg", label: "GHG Intensity", unit: "COUNT", value: 0.62, trend: randSpark(0.66, 0.05), status: "green" },
      secondary: [
        { code: "waste", label: "Waste YoY", unit: "PCT", value: 12, status: "green" },
        { code: "energy", label: "Energy/Unit", unit: "COUNT", value: 1.14, status: "amber" },
        { code: "gov", label: "Governance", unit: "PCT", value: 92, status: "green" },
      ],
    },
  ];
}

/* ====================== OwnerOS constants (insights) ====================== */
type CategoryKeyMap = Record<CategoryKey, string>;
const CAT_LABEL: CategoryKeyMap = {
  strategy: "Strategy",
  structure: "Org Structure",
  sop: "SOP",
  hr: "HR",
  finance: "Finance",
  sales: "Sales",
};
const CAT_ORDER: CategoryKey[] = ["strategy", "structure", "sop", "hr", "finance", "sales"];

/* ====================== Page Component ====================== */
function DashboardPageImpl() {
  const { profile } = useUserProfile();
  const uid = (profile as any)?.id || null;
  const orgId = uid; // TODO: ถ้า orgId แยกจาก user ให้แก้จุดนี้

  const packs = useMemo(() => mockCategories(), []);
  const [active, setActive] = useState<Category7Key>(packs[0].key);
  const [showAllSecondary, setShowAllSecondary] = useState(false);

  // Header year selection (OwnerOS Insights)
  const thisYear = new Date().getFullYear();
  const [availableYears, setAvailableYears] = useState<number[]>([thisYear]);
  const [year, setYear] = useState<number>(thisYear);
  const [compareYear, setCompareYear] = useState<number>(thisYear - 1);

  // OwnerOS (Insights footer)
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [total, setTotal] = useState<Record<number, TotalRow | undefined>>({});
  const [cats, setCats] = useState<Record<number, CatRow[]>>({});
  const [warns, setWarns] = useState<Record<number, WarnRow[]>>({});
  const [trend, setTrend] = useState<Array<{ year: number; value: number }>>([]);

  // === Real KPIs (Sales MTD, AR>30, NPS) ===
  const [salesMtdReal, setSalesMtdReal] = useState<number | null>(null);
  const [arOver30Real, setArOver30Real] = useState<number | null>(null);
  const [npsReal, setNpsReal] = useState<number | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState<string | null>(null);

  useEffect(() => {
    try { posthog?.capture("Dashboard Viewed", { section: "ceo_focus", active }); } catch {}
  }, [active]);

  // ปีที่มีข้อมูล (OwnerOS)
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase.rpc("fn_available_years_for_me");
      if (!mounted || !data?.length) return;
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

  // === โหลด KPI จริง (Sales MTD, AR>30, NPS) ===
  useEffect(() => {
    if (!orgId) return;
    let mounted = true;
    (async () => {
      setKpiLoading(true); setKpiError(null);
      try {
        const [s, ar, nps] = await Promise.all([
          getSalesMtd(orgId),
          getArOver30(orgId, new Date()),
          getNpsThisMonth(orgId),
        ]);
        if (!mounted) return;
        setSalesMtdReal(s);
        setArOver30Real(ar);
        setNpsReal(nps);
      } catch (e: any) {
        setKpiError(e?.message || "Load KPI failed");
      } finally {
        mounted && setKpiLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [orgId]);

  // ===== Hero values (ผสม real + mock สำรอง) =====
  const mockSales = packs.find(p=>p.key==="financial")!.secondary.find(k=>k.code==="revenue")!.value;
  const salesMtdDisplay = (salesMtdReal ?? mockSales);
  const mockNps = packs.find(p=>p.key==="customer")!.secondary.find(k=>k.code==="nps")!.value;
  const npsDisplay = (npsReal ?? mockNps);

  function riskLevelFromAr(v: number | null) {
    if (v == null) return "green";
    if (v > 600_000) return "red";
    if (v > 400_000) return "amber";
    return "green";
  }
  function riskLevelFromNps(v: number | null) {
    if (v == null) return "green";
    if (v < 0) return "red";
    if (v < 30) return "amber";
    return "green";
  }
  const atRiskCount = {
    red: [riskLevelFromAr(arOver30Real), riskLevelFromNps(npsReal)].filter(r=>r==="red").length,
    amber: [riskLevelFromAr(arOver30Real), riskLevelFromNps(npsReal)].filter(r=>r==="amber").length,
  };

  /* ====================== UI ====================== */
  const heroRunway = packs.find(p => p.key === "financial")!.primary;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-1)]">CEOPolar — Mission Control</h1>
          <div className="flex items-center gap-2 text-sm">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-dark">
              {availableYears.map((y) => (<option key={y} value={y}>ปี {y}</option>))}
            </select>
            <span className="muted">เทียบกับ</span>
            <select value={compareYear} onChange={(e) => setCompareYear(Number(e.target.value))} className="input-dark">
              {availableYears.map((y) => (<option key={y} value={y}>ปี {y}</option>))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 btn-primary" onClick={() => alert("ส่งรายงานเช้า (mock)")}>
            ส่ง Morning Report <ArrowRight size={18} />
          </button>
          <button className="inline-flex items-center gap-2 btn-outline" onClick={() => alert("Export (mock)")}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* HERO STRIP — การ์ดใหญ่ 4 ใบ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <HeroCard
          title="Sales MTD"
          value={`฿ ${fmtMoney2(salesMtdDisplay)}`}
          sub={kpiLoading ? "กำลังโหลด…" : (kpiError ? "เกิดข้อผิดพลาด" : "รวมทุกช่องทาง")}
        />
        <HeroCard
          title="Runway (วัน)"
          value={`${heroRunway.value.toLocaleString()} วัน`}
          sub="Cash & Liquidity"
          trend={heroRunway.trend}
          status={heroRunway.status}
        />
        <HeroCard
          title="At-risk KPIs"
          value={`${atRiskCount.red}R • ${atRiskCount.amber}A`}
          sub={arOver30Real!=null ? `AR>30 ฿${arOver30Real.toLocaleString(undefined,{minimumFractionDigits:0})}` : "นับจาก NPS/AR (เบื้องต้น)"}
        />
        <HeroCard
          title="NPS"
          value={`${Math.round(npsDisplay)}`}
          sub={npsReal==null ? "ยังเป็น mock (อัป NPS CSV เพื่อใช้จริง)" : "คะแนนเดือนนี้"}
          status={riskLevelFromNps(npsReal)}
        />
      </div>

      {/* Sticky Category Tabs */}
      <div
        className="panel-dark p-3 sticky top-0 z-20 backdrop-blur"
        style={{ background: "color-mix(in srgb, var(--panel) 70%, transparent)" }}
      >
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {packs.map((p) => (
            <CategoryChip
              key={p.key}
              active={active === p.key}
              label={p.label}
              color={p.color}
              icon={p.icon}
              brief={p.primary}
              onClick={() => { setActive(p.key); setShowAllSecondary(false); }}
            />
          ))}
        </div>
      </div>

      {/* Active Category Panel */}
      {packs.map((p) =>
        p.key !== active ? null : (
          <div key={p.key} className="space-y-6">
            <PrimaryKpiCard pack={p} />
            <SecondaryKpiGridCollapsed
              color={p.color}
              items={p.secondary}
              collapsed={!showAllSecondary}
              onToggle={() => setShowAllSecondary((s) => !s)}
            />
            <AlertsSummary color={p.color} items={[p.primary, ...p.secondary]} />
          </div>
        )
      )}

      {/* Insights */}
      <details className="panel-dark">
        <summary className="p-4 cursor-pointer select-none">Insights (Radar • Progress • Trend)</summary>
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="panel-dark p-4" style={{ color: "var(--danger)" }}>
              เกิดข้อผิดพลาด: {errorMsg}
            </div>
          )}

          {/* Radar */}
          <div className="panel-dark">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Target size={18} style={{ color: "var(--accent)" }} />
                <h3 className="panel-title">Radar Chart (ปี {compareYear} vs ปี {year})</h3>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData(cats, year, compareYear)}>
                  <PolarGrid stroke="var(--chart-grid)" />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis />
                  <Radar name={`${year}`} dataKey="scoreA" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.45} />
                  <Radar name={`${compareYear}`} dataKey="scoreB" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.22} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Progress */}
          <div className="panel-dark">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} style={{ color: "var(--accent)" }} />
                <h3 className="panel-title">ความคืบหน้าตามหมวด (ปี {year})</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryBars(cats, warns, year)}>
                  <CartesianGrid stroke="var(--chart-grid)" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <RBar dataKey="value" fill="var(--chart-1)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend */}
          {trend.length > 0 && (
            <div className="panel-dark">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} style={{ color: "var(--accent)" }} />
                  <h3 className="panel-title">Trend Over Time</h3>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trend}>
                    <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="var(--chart-1)" dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

// helper memos
function radarData(cats: Record<number, CatRow[]>, year: number, compareYear: number){
  const a = cats[year] || [];
  const b = cats[compareYear] || [];
  const byA = new Map(a.map((r) => [r.category, r.score]));
  const byB = new Map(b.map((r) => [r.category, r.score]));
  return CAT_ORDER.map((cat) => ({
    category: CAT_LABEL[cat],
    scoreA: Number(byA.get(cat) ?? 0),
    scoreB: Number(byB.get(cat) ?? 0),
  }));
}

function categoryBars(
  cats: Record<number, CatRow[]>,
  warns: Record<number, WarnRow[]>,
  year: number
){
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
}

export default dynamic(() => Promise.resolve(DashboardPageImpl), { ssr: false });

/* ====================== Local Components ====================== */

function HeroCard({
  title,
  value,
  sub,
  trend,
  status,
}: {
  title: string;
  value: string;
  sub?: string;
  trend?: number[];
  status?: KPI["status"];
}) {
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm muted">{title}</div>
        {status && <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: statusColor(status) }} />}
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-[var(--text-1)] mt-1">{value}</div>
      {sub && <div className="text-xs muted mt-1">{sub}</div>}
      {trend && (
        <div className="h-[58px] mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend.map((v, i) => ({ x: i, v }))}>
              <Area type="monotone" dataKey="v" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.08} strokeWidth={1.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  label,
  color,          // ไม่ใช้ตรง ๆ แล้ว แต่คง signature ไว้
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
  const activeStyle = active ? { boxShadow: "0 0 0 2px var(--ring-soft)" } : undefined;
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-xl text-sm flex items-center gap-2"
      style={{ background: "rgba(255,255,255,.05)", ...(activeStyle || {}) }}
    >
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: "var(--accent)" }}>
        <Icon size={16} className="text-white" />
      </span>
      <span className="font-medium text-[var(--text-1)]">{label}</span>
      <span
        className="text-xs px-2 py-0.5 rounded-full ml-1"
        style={{ border: `1px solid var(--border)`, color: "var(--text-2)" }}
      >
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
          <div className="panel-title">{pack.label} • Primary</div>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-xs"
          style={{
            background: "color-mix(in srgb, var(--accent) 14%, transparent)",
            color: "var(--text-1)",
            border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
          }}
        >
          {k.code.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-2">
        <div className="col-span-12 md:col-span-5">
          <div className="text-sm muted mb-1">{k.label}</div>
          <div className="text-3xl font-extrabold tracking-tight text-[var(--text-1)]">{renderValue(k)}</div>
        </div>
        <div className="col-span-12 md:col-span-7">
          {k.trend && (
            <div className="h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={k.trend.map((v, i) => ({ x: i, v }))}>
                  <defs>
                    <linearGradient id={`grad-${k.code}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="var(--chart-1)" fill={`url(#grad-${k.code})`} strokeWidth={1.8} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button className="btn-primary inline-flex items-center gap-2">Assign <ArrowRight size={16} /></button>
        <button className="btn-outline inline-flex items-center gap-2">เปิดแหล่งข้อมูล <FileText size={16} /></button>
      </div>
    </div>
  );
}

function SecondaryKpiGridCollapsed({
  color, // ไม่ใช้ตรง ๆ แล้ว
  items,
  collapsed,
  onToggle,
}: {
  color: string;
  items: KPI[];
  collapsed: boolean;
  onToggle: () => void;
}) {
  const shown = collapsed ? items.slice(0, 3) : items;
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} style={{ color: "var(--accent)" }} />
          <div className="panel-title">Secondary KPIs</div>
        </div>
        <button className="btn-outline text-xs px-2 py-1" onClick={onToggle}>
          {collapsed ? "ดูทั้งหมด" : "ย่อ"}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
        {shown.map((k) => (
          <div key={k.code} className="panel-dark p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm muted">{k.label}</div>
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: statusColor(k.status) }} />
            </div>
            <div className="text-xl font-semibold text-[var(--text-1)] mt-1">{renderValue(k)}</div>
            {k.trend && (
              <div className="h-[48px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={k.trend.map((v, i) => ({ x: i, v }))}>
                    <Area type="monotone" dataKey="v" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.10} strokeWidth={1.6} />
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

function AlertsSummary({ color, items }: { color: string; items: KPI[] }) {
  const list = items.filter((k) => k.status !== "green");
  const red = list.filter((k) => k.status === "red").length;
  const amber = list.filter((k) => k.status === "amber").length;
  const top = list.slice(0, 3);

  return (
    <div className="panel-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={18} style={{ color: "var(--accent)" }} />
        <div className="panel-title">Alerts</div>
        <span
          className="ml-auto text-xs px-2 py-1 rounded-full"
          style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
        >
          {red}R • {amber}A
        </span>
      </div>
      {top.length ? (
        <ul className="space-y-2">
          {top.map((a) => (
            <li key={a.code} className="panel-dark p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: statusColor(a.status) }} />
                <div className="font-medium text-[var(--text-1)]">{a.label}</div>
              </div>
              <span className="text-xs muted">{renderValue(a)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm muted">ไม่มีความเสี่ยงสำคัญ</div>
      )}
      <div className="mt-3">
        <Link href={`/checklist`} className="btn-primary inline-flex items-center gap-2">Assign งาน <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}

/* ====================== Shared tiny utils ====================== */

function statusColor(s: KPI["status"]) {
  return s === "green" ? "#2FA56D" : s === "amber" ? "#C99532" : "#D26666";
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