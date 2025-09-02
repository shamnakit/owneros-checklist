// /src/pages/dashboard.tsx – Bizsystem Dashboard (v2)
// Modern CEO-first layout with Hero, Quadrant, Radar, Category Cards, Trend, Action Panel, and Add-on Suggestions

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/utils/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ReferenceLine,
  LineChart,
  Line,
} from "recharts";
import { AlertTriangle, ArrowRight, CheckCircle2, Download } from "lucide-react";

/** ---------- Types ---------- */
type CategoryKey = "strategy" | "structure" | "sop" | "hr" | "finance" | "sales";

type CatRow = {
  category: CategoryKey | string;
  score: number; // ได้จริง
  max_score_category: number; // เต็มหมวด
  evidence_rate_pct: number; // 0..100
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
  score_points: number;
};

/** ---------- Constants ---------- */
const CAT_LABEL: Record<CategoryKey, string> = {
  strategy: "Strategy",
  structure: "Structure",
  sop: "SOP",
  hr: "HR",
  finance: "Finance",
  sales: "Sales",
};

const CAT_ORDER: CategoryKey[] = [
  "strategy",
  "structure",
  "sop",
  "hr",
  "finance",
  "sales",
];

/** ---------- Helpers ---------- */
function pct(n: number) {
  const v = isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
  return `${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function toPct(n: number, d: number) {
  if (!d || d === 0) return 0;
  return (Number(n) / Number(d)) * 100;
}

function thaiTier(tier: TotalRow["tier_label"]) {
  if (tier === "Excellent") return "Excellent";
  if (tier === "Developing") return "Developing";
  return "Early Stage";
}

/** ---------- Component ---------- */
function DashboardPageImpl() {
  const { uid, profile } = useUserProfile();
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(thisYear);
  const [compareYear, setCompareYear] = useState<number>(thisYear - 1);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // per-year data (จาก RPC)
  const [total, setTotal] = useState<Record<number, TotalRow | undefined>>({});
  const [cats, setCats] = useState<Record<number, CatRow[]>>({});
  const [warns, setWarns] = useState<Record<number, WarnRow[]>>({});
  const [industryAvg, setIndustryAvg] = useState<Record<number, IndustryAvgRow | undefined>>({});

  // Multi-year trend
  const [trend, setTrend] = useState<Array<{ year: number; value: number }>>([]);

  // โหลดปีที่มีจริง
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.rpc("fn_available_years_for_me");
      if (!mounted) return;
      if (error) {
        console.error(error);
        setAvailableYears([thisYear]);
      } else {
        const years = (data || [])
          .map((r: any) => Number(r.year_version))
          .filter(Boolean)
          .sort((a: number, b: number) => a - b);
        setAvailableYears(years.length ? years : [thisYear]);
        if (years.length) {
          setYear((y) => (years.includes(y) ? y : years[years.length - 1]));
          // default compare = previous one
          const idx = years.indexOf(years[years.length - 1]);
          const cy = idx > 0 ? years[idx - 1] : years[0];
          setCompareYear((prev) => (years.includes(prev) ? prev : cy));
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  // ป้องกันเลือกปีซ้ำกัน
  useEffect(() => {
    if (!availableYears.length) return;
    if (year === compareYear) {
      const alt = availableYears.find((y) => y !== year);
      if (alt) setCompareYear(alt);
    }
  }, [year, compareYear, availableYears]);

  // โหลดข้อมูลคะแนนต่อปี (2 ปีที่เลือก)
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
              supabase
                .from("vw_checked_without_evidence")
                .select("*")
                .eq("year_version", y)
                .limit(999),
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
          const normalizedCats =
            (c.data as CatRow[] | null)?.map((r) => ({
              ...r,
              category: String(r.category).trim().toLowerCase(),
            })) ?? [];
          catsMap[y] = normalizedCats;
          warnsMap[y] =
            (w.data as WarnRow[] | null)?.map((r) => ({
              ...r,
              category: String(r.category).trim().toLowerCase(),
            })) ?? [];
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
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [uid, year, compareYear]);

  // โหลดข้อมูล trend ทุกปีที่มี
  useEffect(() => {
    if (!uid || !availableYears.length) return;
    let mounted = true;
    (async () => {
      try {
        const results = await Promise.all(
          availableYears.map(async (y) => {
            const t = await supabase.rpc("fn_score_total_for_me", { p_year: y, p_require_evidence: true });
            const row = (t.data as TotalRow[] | null)?.[0];
            return { y, value: row ? Number(row.total_score) : 0 };
          })
        );
        if (!mounted) return;
        setTrend(results.map((r) => ({ year: r.y, value: r.value })));
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid, availableYears]);

  /** ===== Derived charts data ===== */
  const companyName = profile?.company_name || "บริษัทของฉัน";
  const totalA = total[year];
  const totalB = total[compareYear];
  const indA = industryAvg[year];

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
        name: CAT_LABEL[cat],
        value: row ? Math.round(toPct(Number(row.score), Math.max(1, Number(row.max_score_category)))) : 0,
        evidenceRate: Number(row?.evidence_rate_pct ?? 0),
        warnings: warnCount.get(cat) || 0,
        raw: row,
        key: cat,
      };
    });
  }, [cats, warns, year]);

  // Quadrant (Quality vs Progress)
  const overallScorePct = useMemo(() => {
    if (!totalA) return 0;
    return toPct(Number(totalA.total_score), Math.max(1, Number(totalA.max_score)));
  }, [totalA]);

  const overallProgressPct = useMemo(() => {
    // proxy = avg evidence rate across categories (ถ้าไม่มี ให้ 0)
    const a = cats[year] || [];
    if (!a.length) return 0;
    const avg = a.reduce((s, r) => s + Number(r.evidence_rate_pct || 0), 0) / a.length;
    return Math.max(0, Math.min(100, avg));
  }, [cats, year]);

  const quadrantPoint = useMemo(() => [{ x: overallScorePct, y: overallProgressPct }], [overallScorePct, overallProgressPct]);

  // Benchmark bar
  const benchmarkBarData = useMemo(() => {
    if (!totalA || !indA) return [] as Array<{ name: string; value: number }>;
    return [
      { name: "Company", value: Math.round(Number(totalA.total_score)) },
      { name: "Industry Avg", value: Math.round(Number(indA.avg_score)) },
    ];
  }, [totalA, indA]);

  const diffText = useMemo(() => {
    if (!totalA || !indA) return "";
    const diff = Math.round(Number(totalA.total_score) - Number(indA.avg_score));
    return `${diff >= 0 ? "+" : ""}${diff}`;
  }, [totalA, indA]);

  // Top gaps (warnings)
  const topGaps = useMemo(() => {
    const list = (warns[year] || []).slice(0, 3);
    return list.map((w) => ({ title: w.name, category: String(w.category).toUpperCase(), id: w.checklist_id }));
  }, [warns, year]);

  // Add-on suggestions (simple rule)
  const addonSuggestions = useMemo(() => {
    const list: Array<{ title: string; desc: string; href: string }> = [];
    const byKey: Record<string, number> = {};
    categoryBars.forEach((b) => (byKey[b.key] = b.evidenceRate));

    if ((byKey["sop"] ?? 100) < 60) list.push({ title: "Policy & SOP Acknowledgement", desc: "เก็บนโยบาย/คู่มือ + บันทึกการอ่าน/ยอมรับ เพื่อดัน Evidence", href: "/modules/policy" });
    if ((byKey["finance"] ?? 100) < 60) list.push({ title: "River KPI", desc: "Dashboard KPI รายเดือน + Budget vs Actual", href: "/modules/river-kpi" });
    if ((byKey["strategy"] ?? 100) < 60) list.push({ title: "Goal Execution Tracker", desc: "ปักเป้าหมายรายหมวด + ติดตาม % บรรลุ", href: "/modules/goal" });
    if ((byKey["structure"] ?? 100) < 60) list.push({ title: "Risk Register", desc: "บริหารความเสี่ยง L×I + DOA/CoI/Whistleblowing", href: "/modules/risk" });
    if (!list.length) list.push({ title: "Filing Module (IPO/Prospectus)", desc: "รวมหลักฐานสร้าง Binder พร้อมยื่น/นักลงทุน", href: "/modules/filing" });
    return list.slice(0, 2);
  }, [categoryBars]);

  /** ---------- Export Binder ---------- */
  const handleExport = async (uploadToStorage = false) => {
    if (!uid) return;
    try {
      const params = new URLSearchParams({ userId: uid, year: String(year), companyName, upload: uploadToStorage ? "1" : "0" });
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
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `Binder_${companyName.replace(/[^\w\-]+/g, "_")}_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      console.error(e);
      alert("Export ไม่สำเร็จ: " + (e?.message || "unknown"));
    }
  };

  /** ---------- Render ---------- */
  return (
    <div className="p-6 grid gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{companyName}</h1>
          <div className="flex items-center gap-2">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded-md px-2 py-1">
              {availableYears.map((y) => (
                <option key={y} value={y}>ปี {y}</option>
              ))}
            </select>
            <span className="text-sm text-gray-500">เทียบกับ</span>
            <select value={compareYear} onChange={(e) => setCompareYear(Number(e.target.value))} className="border rounded-md px-2 py-1">
              {availableYears.map((y) => (
                <option key={y} value={y}>ปี {y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="bg-green-600 text-white flex gap-2" onClick={() => handleExport(false)}>
            <Download size={18} /> Export XLSX (ดาวน์โหลด)
          </Button>
          <Button className="bg-blue-600 text-white flex gap-2" onClick={() => handleExport(true)}>
            <Download size={18} /> Export & Upload (ลิงก์ชั่วคราว)
          </Button>
        </div>
      </div>

      {/* Error/Loading */}
      {errorMsg && (
        <Card className="border-red-300">
          <div className="p-4 text-red-700">เกิดข้อผิดพลาด: {errorMsg}</div>
        </Card>
      )}
      {loading && (
        <Card>
          <div className="p-4">กำลังโหลดข้อมูล…</div>
        </Card>
      )}

      {/* Hero – Score & Tier & Benchmark */}
      {!loading && totalA && (
        <Card className="shadow-lg">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div>
              <h2 className="text-4xl font-bold">
                {Math.round(Number(totalA.total_score)).toLocaleString()} / {Number(totalA.max_score).toLocaleString()}
              </h2>
              <p className="text-gray-600">
                {pct(toPct(Number(totalA.total_score), Math.max(1, Number(totalA.max_score))))} ความพร้อม • ปี {year}
              </p>
            </div>
            <div className="text-center">
              <span
                className={
                  "px-4 py-2 rounded-2xl font-semibold " +
                  (totalA.tier_label === "Excellent"
                    ? "bg-emerald-100 text-emerald-700"
                    : totalA.tier_label === "Developing"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700")
                }
              >
                Tier: {thaiTier(totalA.tier_label)}
              </span>
              {totalB && (
                <p className="text-sm text-gray-500 mt-1">
                  เทียบปี {compareYear}: {Math.round(Number(totalB.total_score)).toLocaleString()} / {Number(totalB.max_score).toLocaleString()} ({thaiTier(totalB.tier_label)})
                </p>
              )}
            </div>
            <div className="text-sm text-gray-700 md:text-right">
              {indA ? (
                <div>
                  Industry Diff: <span className={Number(diffText) >= 0 ? "text-emerald-700" : "text-red-700"}>{diffText}</span>
                </div>
              ) : (
                <div className="text-gray-500">ยังไม่มีข้อมูลเฉลี่ยอุตสาหกรรม</div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Quadrant – Progress vs Quality */}
      {!loading && (
        <Card className="shadow-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Progress vs Quality (ปี {year})</h3>
              <div className="text-sm text-gray-600">Score: {pct(overallScorePct)} · Progress: {pct(overallProgressPct)}</div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 text-xs text-gray-600 mt-2">
              <div className="p-1">🚧 Early Stage</div>
              <div className="p-1">⚠️ Quality Uplift</div>
              <div className="p-1">⏳ Quick Wins</div>
              <div className="p-1">✅ Ready</div>
            </div>
          </div>
        </Card>
      )}

      {/* Radar – Year compare */}
      {!loading && (
        <Card className="shadow-md">
          <div className="p-6">
            <h3 className="font-semibold mb-2">Radar Chart (ปี {compareYear} vs ปี {year})</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis />
                <Radar name={`${year}`} dataKey="scoreA" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} />
                <Radar name={`${compareYear}`} dataKey="scoreB" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Category Cards – Progress & Evidence */}
      {!loading && (
        <Card className="shadow-md">
          <div className="p-6">
            <h3 className="font-semibold mb-4">ความคืบหน้าตามหมวด (ปี {year})</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryBars}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryBars.map((item) => {
                const showWarnMax0 = (item.raw?.max_score_category ?? 0) === 0;
                return (
                  <div key={item.name} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-600">Evidence rate: {pct(item.evidenceRate)}</div>
                      {showWarnMax0 ? (
                        <div className="text-xs text-red-600">ยังไม่ได้ตั้งคะแนนใน template</div>
                      ) : item.warnings > 0 ? (
                        <div className="text-xs text-yellow-700 flex items-center gap-1"><AlertTriangle size={14} /> หลักฐานไม่ครบ {item.warnings} รายการ</div>
                      ) : (
                        <div className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 size={14} /> หลักฐานครบ</div>
                      )}
                    </div>
                    <Link href={`/checklist?tab=${item.key}&year=${year}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      ไปกรอก/อัปโหลดต่อ <ArrowRight size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Trend – Multi-year */}
      {trend.length > 0 && (
        <Card className="shadow-md">
          <div className="p-6">
            <h3 className="font-semibold mb-2">Trend Over Time</h3>
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
        </Card>
      )}

      {/* Gap & Action + Addon Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md md:col-span-2">
          <div className="p-6">
            <h3 className="font-semibold mb-3">Gap & Action Panel</h3>
            {topGaps.length ? (
              <ul className="space-y-2">
                {topGaps.map((g) => (
                  <li key={g.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-red-600" size={18} />
                      <div>
                        <div className="font-medium">{g.title}</div>
                        <div className="text-xs text-gray-500">หมวด: {g.category}</div>
                      </div>
                    </div>
                    <Link href={`/checklist?year=${year}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      Assign to team <ArrowRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">ไม่พบช่องว่างสำคัญ</div>
            )}
          </div>
        </Card>

        <Card className="shadow-md">
          <div className="p-6">
            <h3 className="font-semibold mb-3">Suggestions (Add-on)</h3>
            <ul className="space-y-3">
              {addonSuggestions.map((s, idx) => (
                <li key={idx} className="border rounded-md p-3">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-gray-600 mb-2">{s.desc}</div>
                  <Link href={s.href} className="text-sm text-blue-600 hover:underline flex items-center gap-1">ดูรายละเอียด <ArrowRight size={14} /></Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(DashboardPageImpl), { ssr: false });
