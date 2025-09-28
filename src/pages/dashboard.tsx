// /src/pages/dashboard.tsx — CEOPolar Mission Control (Executive Green v1 + Mock Badges + TH labels)

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
  target?: number | null;
  color?: string; // custom KPI color
  status: "green" | "amber" | "red";
  note?: string | null;
  mock?: boolean; // ✅ ข้อมูลจำลอง?
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

// NEW: Helper สำหรับ Data Freshness Tag
const fmtLastUpdated = (date: Date | null) => {
  if (!date) return "กำลังโหลดข้อมูล...";
  const time = date.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit', hour12: false });
  const day = date.toLocaleDateString("th-TH", { day: 'numeric', month: 'short' });
  return `ข้อมูลอัปเดต ณ ${time} น. (${day})`;
};

/* ===== TH labels for KPI headers ===== */
const LABEL_TH: Record<string, string> = {
  // Finance
  runway: "เงินสดพอใช้ (วัน)",
  revenue: "ยอดขายเดือนนี้ (MTD)",
  gm: "อัตรากำไรขั้นต้น",
  arOver30: "ลูกหนี้เกิน 30 วัน",
  apOver30: "เจ้าหนี้เกิน 30 วัน",
  inventoryDays: "สต็อกคงเหลือ (วัน)",

  // Customer
  retention: "อัตราการรักษาลูกค้า",
  nps: "คะแนนความพึงพอใจ (NPS)",
  cac: "ต้นทุนหาลูกค้า (CAC)",
  clv: "มูลค่าตลอดอายุลูกค้า (CLV)",

  // People
  turnover: "อัตราลาออกต่อปี",
  engagement: "คะแนนมีส่วนร่วม",
  vacancy: "ตำแหน่งว่าง",
  tth: "เวลาหาคน (Time-to-Hire)",

  // Operational
  oft: "ระยะเวลาส่งมอบ (วัน)",
  rpe: "รายได้ต่อพนักงาน",
  defect: "อัตราของเสีย",
  otd: "ส่งตรงเวลา",

  // Strategy
  mshare: "ส่วนแบ่งตลาด",
  ttm: "เวลาสู่ตลาด (Time-to-Market)",
  winrate: "อัตราชนะดีล",
  pipeline: "มูลค่าโอกาสขาย",

  // Innovation
  newrev: "รายได้จากสินค้านวัตกรรม",
  rnd: "งบวิจัยต่อรายได้",
  ideas: "จำนวนไอเดีย",
  t2proto: "เวลาถึงต้นแบบ",

  // ESG
  ghg: "ความเข้มข้นก๊าซเรือนกระจก",
  waste: "ของเสียเทียบปีก่อน (YoY)",
  energy: "พลังงานต่อหน่วย",
  gov: "ธรรมาภิบาล",

  // Virtual (Hero)
  at_risk: "ตัวชี้วัดเสี่ยงรวม",
  sales_mtd: "ยอดขายเดือนนี้ (MTD)",
  runway_days: "เงินสดพอใช้ (วัน)",
  pipeline_value: "มูลค่าโอกาสขายรวม",
};
function withThai(enLabel: string, code?: string) {
  const th = code && LABEL_TH[code];
  return th ? `${enLabel} · ${th}` : enLabel;
}

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

// NEW Muted Colors (ขรึม)
const COLOR_RUNWAY = "#C9A96A"; // Gold/Bronze
const COLOR_SALES = "#4A9C9B"; // Teal
const COLOR_GM = "#58A870";     // Green
const COLOR_PIPELINE = "#8D7AB5"; // Violet
const COLOR_RISK = "#A36B4F";   // Brown-Orange
const ACCENT = "var(--accent)"; // Default accent

// ✅ Toggle ป้าย MOCK ทั้งหน้า
const SHOW_MOCK_BADGE = true;

// ✅ ป้าย MOCK ใช้ซ้ำ
function MockBadge() {
  if (!SHOW_MOCK_BADGE) return null;
  return (
    <span
      className="ml-2 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded"
      style={{ background: "var(--warning)", color: "var(--panel)", border: "1px solid var(--border)" }}
      title="ข้อมูลตัวอย่าง (Mock Data)"
    >
      MOCK
    </span>
  );
}

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

  const gmTarget = 30;
  const pipelineValue = 45_200_000;
  const revenueTarget = 1_500_000;
  const runwayTarget = 90;

  return [
    {
      key: "financial",
      label: "Financial",
      color: ACCENT,
      icon: Wallet,
      primary: {
        code: "runway", label: "Cash & Runway (วัน)", unit: "DAYS",
        value: runway, trend: randSpark(75, 0.04), status: traffic.runway(runway),
        target: runwayTarget, color: COLOR_RUNWAY, mock: true
      },
      secondary: [
        { code: "revenue", label: "Sales MTD (฿)", unit: "THB", value: 1_250_000, trend: randSpark(1_200_000, 0.12), mom: 12, yoy: revenueYoY, status: traffic.revenueYoY(revenueYoY), target: revenueTarget, color: COLOR_SALES, mock: true },
        { code: "gm", label: "GM%", unit: "PCT", value: gm, status: traffic.gm(gm), target: gmTarget, color: COLOR_GM, mock: true },
        { code: "arOver30", label: "AR >30 (฿)", unit: "THB", value: ar30, status: ar30 <= 400000 ? "green" : ar30 <= 600000 ? "amber" : "red", mock: true },
        { code: "apOver30", label: "AP >30 (฿)", unit: "THB", value: ap30, status: ap30 <= 300000 ? "green" : ap30 <= 450000 ? "amber" : "red", mock: true },
        { code: "inventoryDays", label: "Inventory Days", unit: "DAYS", value: inventory, status: traffic.inventoryDays(inventory), mock: true },
      ],
    },
    {
      key: "customer",
      label: "Customer",
      color: ACCENT,
      icon: Users,
      primary: { code: "retention", label: "Retention Rate", unit: "PCT", value: retention, trend: randSpark(86, 0.02), status: traffic.retention(retention), mock: true },
      secondary: [
        { code: "nps", label: "NPS", unit: "PCT", value: nps, status: traffic.nps(nps), mock: true },
        { code: "cac", label: "CAC (฿)", unit: "THB", value: 950, status: "amber", mock: true },
        { code: "clv", label: "CLV (฿)", unit: "THB", value: 18_500, status: "green", mock: true },
      ],
    },
    {
      key: "people",
      label: "People",
      color: ACCENT,
      icon: UserCircle2,
      primary: { code: "turnover", label: "Turnover (ปี%)", unit: "PCT", value: turnover, trend: randSpark(11, 0.06), status: traffic.turnover(turnover), mock: true },
      secondary: [
        { code: "engagement", label: "Engage", unit: "PCT", value: 76, status: "green", mock: true },
        { code: "vacancy", label: "Vacancy", unit: "PCT", value: 3.2, status: "green", mock: true },
        { code: "tth", label: "Time-to-Hire", unit: "DAYS", value: 22, status: "amber", mock: true },
      ],
    },
    {
      key: "operational",
      label: "Operational",
      color: ACCENT,
      icon: Activity,
      primary: { code: "oft", label: "Fulfillment Time (วัน)", unit: "DAYS", value: 3.6, trend: randSpark(3.8, 0.1), status: "green", mock: true },
      secondary: [
        { code: "rpe", label: "Rev/Emp (฿)", unit: "THB", value: 385_000, status: "green", mock: true },
        { code: "defect", label: "Defect", unit: "PCT", value: 0.9, status: "green", mock: true },
        { code: "otd", label: "On-time", unit: "PCT", value: 94, status: "green", mock: true },
      ],
    },
    {
      key: "strategy",
      label: "Strategy & Market",
      color: ACCENT,
      icon: Target,
      primary: { code: "mshare", label: "Market Share", unit: "PCT", value: 8.4, trend: randSpark(8.1, 0.08), status: "green", color: ACCENT, mock: true },
      secondary: [
        { code: "ttm", label: "Time-to-Market", unit: "DAYS", value: 58, status: "amber", mock: true },
        { code: "winrate", label: "Win Rate", unit: "PCT", value: 28, status: "amber", mock: true },
        { code: "pipeline", label: "Sales Pipeline Value (฿)", unit: "THB", value: pipelineValue, status: "green", color: COLOR_PIPELINE, mock: true },
      ],
    },
    {
      key: "innovation",
      label: "Innovation",
      color: ACCENT,
      icon: Sparkles,
      primary: { code: "newrev", label: "New Product Rev", unit: "PCT", value: 17, trend: randSpark(16, 0.08), status: "green", mock: true },
      secondary: [
        { code: "rnd", label: "R&D/Rev", unit: "PCT", value: 6.2, status: "green", mock: true },
        { code: "ideas", label: "Ideas (#)", unit: "COUNT", value: 28, status: "green", mock: true },
        { code: "t2proto", label: "Time-to-Proto", unit: "DAYS", value: 21, status: "green", mock: true },
      ],
    },
    {
      key: "esg",
      label: "ESG",
      color: ACCENT,
      icon: Leaf,
      primary: { code: "ghg", label: "GHG Intensity", unit: "COUNT", value: 0.62, trend: randSpark(0.66, 0.05), status: "green", mock: true },
      secondary: [
        { code: "waste", label: "Waste YoY", unit: "PCT", value: 12, status: "green", mock: true },
        { code: "energy", label: "Energy/Unit", unit: "COUNT", value: 1.14, status: "amber", mock: true },
        { code: "gov", label: "Governance", unit: "PCT", value: 92, status: "green", mock: true },
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
        setLastUpdated(new Date());
      } catch (e: any) {
        setKpiError(e?.message || "Load KPI failed");
      } finally {
        mounted && setKpiLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [orgId]);

  // ===== Hero values (Real + Fallback) =====
  const mockSales = packs.find(p=>p.key==="financial")!.secondary.find(k=>k.code==="revenue")!.value;
  const salesMtdDisplay = (salesMtdReal ?? mockSales);

  const salesKpi = packs.find(p => p.key === "financial")!.secondary.find(k => k.code === "revenue")!;
  const heroPipeline = packs.find(p=>p.key==="strategy")!.secondary.find(k=>k.code==="pipeline")!;
  const heroRunway = packs.find(p => p.key === "financial")!.primary;

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

  // ✅ Banner รวม: มี mock อยู่ในหน้าไหม
  const hasAnyMock = useMemo(() => {
    if (!SHOW_MOCK_BADGE) return false;
    const inPacks = packs.some(p => p.primary.mock || p.secondary.some(s => s.mock));
    const inHero = (salesMtdReal == null) || (npsReal == null);
    return inPacks || inHero;
  }, [packs, salesMtdReal, npsReal]);

  /* ====================== UI ====================== */
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Title & freshness */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-1)]">CEOPolar — Mission Control</h1>
            <div className="items-center gap-2 text-sm hidden sm:flex">
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-dark">
                {availableYears.map((y) => (<option key={y} value={y}>ปี {y}</option>))}
              </select>
              <span className="muted">เทียบกับ</span>
              <select value={compareYear} onChange={(e) => setCompareYear(Number(e.target.value))} className="input-dark">
                {availableYears.map((y) => (<option key={y} value={y}>ปี {y}</option>))}
              </select>
            </div>
          </div>
          <div className="text-xs text-[var(--text-2)] ml-1">
            {fmtLastUpdated(lastUpdated)}
          </div>
        </div>

        {/* Right: actions & mobile selects */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm sm:hidden">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-dark">
              {availableYears.map((y) => (<option key={y} value={y}>ปี {y}</option>))}
            </select>
            <span className="muted">เทียบกับ</span>
            <select value={compareYear} onChange={(e) => setCompareYear(Number(e.target.value))} className="input-dark">
              {availableYears.map((y) => (<option key={y} value={y}>ปี {y}</option>))}
            </select>
          </div>

          <button className="inline-flex items-center gap-2 btn-primary" onClick={() => alert("ส่งรายงานเช้า (mock)")}>
            ส่ง Morning Report <ArrowRight size={18} />
          </button>
          <button className="inline-flex items-center gap-2 btn-outline" onClick={() => alert("Export (mock)")}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* ✅ แบนเนอร์รวม */}
      {hasAnyMock && (
        <div className="panel-dark p-3 border-l-4" style={{ borderColor: "var(--warning)" }}>
          ⚠️ บางตัวชี้วัดยังเป็นข้อมูลตัวอย่าง (MOCK) — ป้ายนี้จะซ่อนอัตโนมัติเมื่อเชื่อมข้อมูลจริงครบ
        </div>
      )}

      {/* HERO STRIP — 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Sales MTD (Real fallback) */}
        <HeroCard
          title="Sales MTD"
          kpiCode="sales_mtd"
          value={`฿ ${fmtMoney2(salesMtdDisplay)}`}
          sub={kpiLoading ? "กำลังโหลด…" : (kpiError ? "เกิดข้อผิดพลาด" : (salesKpi.yoy != null ? `YoY +${salesKpi.yoy}%` : "รวมทุกช่องทาง"))}
          status={salesKpi.status}
          kpiColor={salesKpi.color}
          isMock={salesMtdReal == null}
        />

        {/* Runway (mock) */}
        <HeroCard
          title="Runway (วัน)"
          kpiCode="runway_days"
          value={`${heroRunway.value.toLocaleString()} วัน`}
          sub={heroRunway.target ? `เป้าหมาย > ${heroRunway.target} วัน` : "Cash & Liquidity"}
          trend={heroRunway.trend}
          status={heroRunway.status}
          kpiColor={heroRunway.color}
          isMock={true}
        />

        {/* At-risk (mix real) */}
        <HeroCard
          title="At-risk KPIs"
          kpiCode="at_risk"
          value={`${atRiskCount.red}R • ${atRiskCount.amber}A`}
          sub={arOver30Real!=null ? `AR>30 ฿${arOver30Real.toLocaleString(undefined,{minimumFractionDigits:0})}` : "นับจาก NPS/AR (เบื้องต้น)"}
          kpiColor={COLOR_RISK}
          isMock={!(arOver30Real != null && npsReal != null)}
        />

        {/* Pipeline (mock) */}
        <HeroCard
          title="Sales Pipeline Value"
          kpiCode="pipeline_value"
          value={`฿ ${fmtMoney2(heroPipeline.value)}`}
          sub="มูลค่ารวมของโอกาสขาย"
          status={heroPipeline.status}
          kpiColor={heroPipeline.color}
          isMock={true}
        />
      </div>

      {/* Sticky tabs */}
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

      {/* Active category */}
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

          {loading ? (
            <div className="text-center muted p-8">กำลังโหลดข้อมูลเชิงลึก OwnerOS...</div>
          ) : (
            <>
              {/* Radar */}
              {cats[year]?.length > 0 && (
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
              )}

              {/* Category Progress */}
              {cats[year]?.length > 0 && (
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
              )}

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
            </>
          )}
        </div>
      </details>
    </div>
  );
}

// helper memos
function radarData(cats: Record<number, CatRow[]>, year: number, compareYear: number){
  const a = cats[year] || [];
  the: {
  }
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
  kpiColor,
  isMock,
  kpiCode,     // ✅ TH label mapping
}: {
  title: string;
  value: string;
  sub?: string;
  trend?: number[];
  status?: KPI["status"];
  kpiColor?: string;
  isMock?: boolean;
  kpiCode?: string;
}) {
  const chartColor = kpiColor || "var(--chart-1)";
  return (
    <div className="panel-dark p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm muted flex items-center">
          {withThai(title, kpiCode)}
          {isMock && <MockBadge />}
        </div>
        {status && <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: statusColor(status) }} />}
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-[var(--text-1)] mt-1">{value}</div>
      {sub && <div className="text-xs muted mt-1">{sub}</div>}
      {trend && (
        <div className="h-[58px] mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend.map((v, i) => ({ x: i, v }))}>
              <Area type="monotone" dataKey="v" stroke={chartColor} fill={chartColor} fillOpacity={0.08} strokeWidth={1.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {!trend && <div className="h-[58px] mt-3" />}
    </div>
  );
}

function CategoryChip({
  active,
  label,
  color,          // keep signature
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
        className="text-xs px-2 py-0.5 rounded-full ml-1 flex items-center gap-1"
        style={{ border: `1px solid var(--border)`, color: "var(--text-2)" }}
      >
        {withThai(brief.label.split(" ")[0], brief.code)}{": "}{renderValue(brief)}
        {brief.mock && <MockBadge />}
      </span>
    </button>
  );
}

function PrimaryKpiCard({ pack }: { pack: CategoryPack }) {
  const k = pack.primary;
  const kpiColor = k.color || "var(--chart-1)";
  const Icon = pack.icon;

  return (
    <div className="panel-dark p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Icon size={24} style={{ color: kpiColor }} />
        <h2 className="text-lg font-semibold text-[var(--text-1)]">
          {pack.label}: {withThai(k.label, k.code)}
        </h2>
        {k.mock && <MockBadge />}
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: statusColor(k.status), color: "var(--panel)" }}>
          {k.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Value & Trend */}
        <div className="col-span-1">
          <div className="text-5xl font-extrabold tracking-tighter text-[var(--text-1)]">
            {renderValue(k)}
          </div>
          <div className="muted mt-1">{withThai(k.label, k.code)}</div>
          {k.target && (
            <div className="text-sm mt-2" style={{ color: kpiColor }}>
              เป้าหมาย: {renderValue({ ...k, value: k.target })}
            </div>
          )}
        </div>

        {/* Sparkline/Trend */}
        <div className="col-span-2">
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(k.trend || randSpark(k.value, 0.05)).map((v, i) => ({ x: i, v }))}>
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke={kpiColor} fill={kpiColor} fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="flex justify-end pt-4 border-t border-[var(--border)]">
        {/* ✅ FIX: legacyBehavior + <a> กัน error child.props */}
        <Link href={`/kpi/${k.code}`} legacyBehavior>
          <a className="btn-outline">ดูแนวโน้มและรายละเอียด</a>
        </Link>
        <button onClick={() => alert(`สร้าง Action Plan สำหรับ ${k.label}`)} className="btn-primary ml-2">
          สร้าง Action Plan
        </button>
      </div>
    </div>
  );
}

function SecondaryKpiGridCollapsed({
  items,
  collapsed,
  onToggle,
  color,
}: {
  items: KPI[];
  collapsed: boolean;
  onToggle: () => void;
  color: string;
}) {
  const displayItems = collapsed ? items.slice(0, 4) : items;

  return (
    <div className="panel-dark p-6 space-y-4">
      <div className="flex items-center gap-2">
        <FileText size={18} style={{ color: color }} />
        <h3 className="panel-title">Secondary KPIs ({items.length} ตัวชี้วัดสำคัญ)</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayItems.map((k) => (
          <div key={k.code} className="p-4 rounded-xl" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div className="text-sm muted flex items-center">
                {withThai(k.label, k.code)}
                {k.mock && <MockBadge />}
              </div>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: statusColor(k.status) }} />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[var(--text-1)] mt-1">{renderValue(k)}</div>
            {k.yoy && (
              <div className="text-xs mt-1" style={{ color: k.yoy >= 0 ? "var(--success)" : "var(--danger)" }}>
                YoY: {k.yoy > 0 ? "+" : ""}{k.yoy}%
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length > 4 && (
        <button className="btn-link mt-4" onClick={onToggle}>
          {collapsed ? `+ ดูอีก ${items.length - 4} รายการ` : "- ซ่อนรายการ"}
        </button>
      )}
    </div>
  );
}

function AlertsSummary({ items }: { items: KPI[]; color: string }) {
  const critical = items.filter((k) => k.status === "red");
  const warning = items.filter((k) => k.status === "amber");

  if (critical.length === 0 && warning.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Critical Alerts (RED) */}
      {critical.length > 0 && (
        <div className="panel-dark p-4 border-l-4" style={{ borderColor: statusColor("red") }}>
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={24} style={{ color: statusColor("red") }} />
            <div className="font-semibold text-[var(--text-1)]">Alerts & Warnings ({critical.length} รายการ)</div>
          </div>
          <ul className="space-y-2">
            {critical.map((k) => (
              <li key={k.code} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: statusColor("red") }} />
                  <span className="muted">{withThai(k.label, k.code)}:</span>
                  <span className="font-medium" style={{ color: statusColor("red") }}>{renderValue(k)}</span>
                </div>
                <button onClick={() => alert(`มอบหมายงาน ${k.label}`)} className="btn-link text-xs">
                  มอบหมายงาน
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warning Alerts (AMBER) */}
      {warning.length > 0 && (
        <div className="panel-dark p-4 border-l-4" style={{ borderColor: statusColor("amber") }}>
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={24} style={{ color: statusColor("amber") }} />
            <div className="font-semibold text-[var(--text-1)]">Needs Attention ({warning.length} รายการ)</div>
          </div>
          <ul className="space-y-2">
            {warning.map((k) => (
              <li key={k.code} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: statusColor("amber") }} />
                  <span className="muted">{withThai(k.label, k.code)}:</span>
                  <span className="font-medium" style={{ color: statusColor("amber") }}>{renderValue(k)}</span>
                </div>
                <button onClick={() => alert(`สร้าง Action Plan ${k.label}`)} className="btn-link text-xs">
                  สร้าง Action Plan
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function statusColor(status: KPI["status"]) {
  switch (status) {
    case "green": return "var(--success)";
    case "amber": return "var(--warning)";
    case "red":   return "var(--danger)";
  }
}

function renderValue(k: KPI): string {
  const v = k.value;
  switch (k.unit) {
    case "THB":  return `฿${fmtMoney2(v)}`;
    case "PCT":  return fmtPct2(v);
    case "DAYS": return `${Math.round(v).toLocaleString()}`;
    case "COUNT":return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
    default:     return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}
