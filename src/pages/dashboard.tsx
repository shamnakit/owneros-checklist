// /src/pages/dashboard.tsx
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
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
} from "recharts";
import { Download, AlertTriangle } from "lucide-react";

// ---------- Types ----------
type CategoryKey = "strategy" | "structure" | "sop" | "hr" | "finance" | "sales" | "addon";

type CatRow = {
  user_id: string;
  year_version: number;
  category: CategoryKey;
  score: number;
  max_score_category: number;
  evidence_rate_pct: number; // 0..100
};

type TotalRow = {
  user_id: string;
  year_version: number;
  total_score: number;
  max_score: number;
  tier_label: "Excellent" | "Developing" | "Early Stage";
};

type WarnRow = {
  user_id: string;
  year_version: number;
  category: CategoryKey;
  checklist_id: string;
  name: string;
  score_points: number;
};

type IndustryAvgRow = {
  industry_section: string;
  year_version: number;
  avg_score: number;
  avg_max_score: number;
};

// ---------- Helpers ----------
const CAT_LABEL: Record<CategoryKey, string> = {
  strategy: "Strategy",
  structure: "Structure",
  sop: "SOP",
  hr: "HR",
  finance: "Finance",
  sales: "Sales",
  addon: "Add-on",
};

const CAT_ORDER: CategoryKey[] = ["strategy", "structure", "sop", "hr", "finance", "sales"];

function pct(n: number) {
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function thaiTier(tier: TotalRow["tier_label"]) {
  if (tier === "Excellent") return "Excellent";
  if (tier === "Developing") return "Developing";
  return "Early Stage";
}

// ---------- Page Impl (client only) ----------
function DashboardPageImpl() {
  const { uid, profile } = useUserProfile();

  // ปีที่ระบบมีจริง (ดึงจาก DB)
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(thisYear);
  const [compareYear, setCompareYear] = useState<number>(thisYear - 1);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // เก็บข้อมูลตามปี
  const [total, setTotal] = useState<Record<number, TotalRow | undefined>>({});
  const [cats, setCats] = useState<Record<number, CatRow[]>>({});
  const [warns, setWarns] = useState<Record<number, WarnRow[]>>({});
  const [industryAvg, setIndustryAvg] = useState<Record<number, IndustryAvgRow | undefined>>({});

  // โหลดปีที่มีจริง
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("checklists_v2")
        .select("year_version")
        .eq("user_id", uid)
        .order("year_version", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      const years = Array.from(
        new Set((data || []).map((r: any) => Number(r.year_version)).filter(Boolean))
      );
      if (mounted) {
        setAvailableYears(years);
        if (years.length) {
          setYear((y) => (years.includes(y) ? y : years[0]));
          setCompareYear((cy) => (years.includes(cy) ? cy : years[1] ?? years[0]));
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  // ถ้าเลือกปีซ้ำกัน ให้สลับ compareYear อัตโนมัติ
  useEffect(() => {
    if (!availableYears.length) return;
    if (year === compareYear) {
      const alt = availableYears.find((y) => y !== year);
      if (alt) setCompareYear(alt);
    }
  }, [year, compareYear, availableYears]);

  // ---------- Fetch data ----------
  useEffect(() => {
    if (!uid) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const years = [year, compareYear];

        // 1) total (ของบริษัท)
        const { data: totalRows, error: totalErr } = await supabase
          .from("vw_score_total")
          .select("*")
          .eq("user_id", uid)
          .in("year_version", years);
        if (totalErr) throw totalErr;

        // 2) categories
        const { data: catRows, error: catErr } = await supabase
          .from("vw_score_by_category")
          .select("*")
          .eq("user_id", uid)
          .in("year_version", years);
        if (catErr) throw catErr;

        // 3) warnings
        const { data: warnRows, error: warnErr } = await supabase
          .from("vw_checked_without_evidence")
          .select("*")
          .eq("user_id", uid)
          .in("year_version", years);
        if (warnErr) throw warnErr;

        // 4) industry average (ถ้ามีหมวดอุตสาหกรรมในโปรไฟล์)
        let indMap: Record<number, IndustryAvgRow | undefined> = {};
        if (profile?.industry_section) {
          const { data: indRows, error: indErr } = await supabase
            .from("vw_score_industry_avg")
            .select("*")
            .eq("industry_section", profile.industry_section)
            .in("year_version", years);
          if (indErr) throw indErr;
          (indRows as IndustryAvgRow[] | null)?.forEach((r) => {
            indMap[r.year_version] = r;
          });
        }

        if (!mounted) return;

        // map per year
        const totalMap: Record<number, TotalRow | undefined> = {};
        (totalRows as TotalRow[] | null)?.forEach((r) => (totalMap[r.year_version] = r));
        setTotal(totalMap);

        const catsMap: Record<number, CatRow[]> = {};
        (catRows as CatRow[] | null)?.forEach((r) => {
          // normalize category
          const cat = (String(r.category).trim().toLowerCase() as CategoryKey);
          const fixed = { ...r, category: cat };
          if (!catsMap[fixed.year_version]) catsMap[fixed.year_version] = [];
          catsMap[fixed.year_version].push(fixed);
        });
        setCats(catsMap);

        const warnMap: Record<number, WarnRow[]> = {};
        (warnRows as WarnRow[] | null)?.forEach((w) => {
          const cat = (String(w.category).trim().toLowerCase() as CategoryKey);
          const fixed = { ...w, category: cat };
          if (!warnMap[fixed.year_version]) warnMap[fixed.year_version] = [];
          warnMap[fixed.year_version].push(fixed);
        });
        setWarns(warnMap);

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
  }, [uid, year, compareYear, profile?.industry_section]);

  // ---------- Compute chart data ----------
  const radarData = useMemo(() => {
    const a = cats[year] || [];
    const b = cats[compareYear] || [];
    const byA = new Map(a.map((r) => [r.category, r.score]));
    const byB = new Map(b.map((r) => [r.category, r.score]));
    return CAT_ORDER.map((cat) => ({
      category: CAT_LABEL[cat],
      scoreA: byA.get(cat) ?? 0,
      scoreB: byB.get(cat) ?? 0,
    }));
  }, [cats, year, compareYear]);

  const barData = useMemo(() => {
    const a = cats[year] || [];
    const w = warns[year] || [];
    const warnCount = new Map<CategoryKey, number>();
    w.forEach((x) => warnCount.set(x.category, (warnCount.get(x.category) || 0) + 1));

    return CAT_ORDER.map((cat) => {
      const row = a.find((c) => c.category === cat);
      return {
        name: CAT_LABEL[cat],
        value: row ? Math.round((row.score / Math.max(1, row.max_score_category)) * 100) : 0,
        evidenceRate: row?.evidence_rate_pct ?? 0,
        warnings: warnCount.get(cat) || 0,
        raw: row,
      };
    });
  }, [cats, warns, year]);

  // [BENCHMARK] เตรียมข้อมูลแสดงผลปีหลัก
  const companyA = total[year];
  const indA = industryAvg[year];

  const benchmarkBarData = useMemo(() => {
    if (!companyA || !indA) return [];
    return [
      { name: "Company", value: Math.round(companyA.total_score) },
      { name: "Industry Avg", value: Math.round(Number(indA.avg_score)) },
    ];
  }, [companyA, indA]);

  const diffText = useMemo(() => {
    if (!companyA || !indA) return "";
    const diff = Math.round(companyA.total_score - Number(indA.avg_score));
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff}`;
  }, [companyA, indA]);

  const totalA = total[year];
  const totalB = total[compareYear];
  const companyName = profile?.company_name || "บริษัทของฉัน";

  // ---------- Export Binder ----------
  const handleExport = async (uploadToStorage = false) => {
    if (!uid) return;
    try {
      const params = new URLSearchParams({
        userId: uid,
        year: String(year),
        companyName,
        upload: uploadToStorage ? "1" : "0",
      });
      const url = `/api/export-binder?${params.toString()}`;
      const res = await fetch(url, { method: "GET" });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }

      if (uploadToStorage) {
        const j = await res.json();
        if (j?.url) {
          window.open(j.url, "_blank");
        } else {
          alert("Export เสร็จ แต่ไม่ได้ลิงก์ไฟล์");
        }
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

  // ---------- UI ----------
  return (
    <div className="p-6 grid gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{companyName}</h1>
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border rounded-md px-2 py-1"
              aria-label="เลือกปีหลัก"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">เทียบกับ</span>
            <select
              value={compareYear}
              onChange={(e) => setCompareYear(Number(e.target.value))}
              className="border rounded-md px-2 py-1"
              aria-label="เลือกปีเปรียบเทียบ"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  ปี {y}
                </option>
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

      {/* Score & Tier */}
      {!loading && totalA && (
        <Card className="shadow-lg">
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold">
                {Math.round(totalA.total_score).toLocaleString()} / {totalA.max_score.toLocaleString()}
              </h2>
              <p className="text-gray-600">
                {pct((totalA.total_score / Math.max(1, totalA.max_score)) * 100)} ความพร้อม • ปี {year}
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
                  เทียบปี {compareYear}: {Math.round(totalB.total_score).toLocaleString()} /{" "}
                  {totalB.max_score.toLocaleString()} ({thaiTier(totalB.tier_label)})
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Radar Chart */}
      {!loading && (
        <Card className="shadow-md">
          <div className="p-6">
            <h3 className="font-semibold mb-2">
              Radar Chart (ปี {compareYear} vs ปี {year})
            </h3>
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

      {/* Progress Bars + Warnings */}
      {!loading && (
        <Card className="shadow-md">
          <div className="p-6">
            <h3 className="font-semibold mb-4">ความคืบหน้าตามหมวด (ปี {year})</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {barData.map((item) => {
                const showWarnMax0 = (item.raw?.max_score_category ?? 0) === 0;
                return (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{item.name}</span>
                      {showWarnMax0 ? (
                        <span className="text-sm text-red-600">ยังไม่ได้ตั้งคะแนนใน template</span>
                      ) : (
                        <span className="text-sm text-gray-500">Evidence rate: {pct(item.evidenceRate)}</span>
                      )}
                    </div>
                    {item.warnings > 0 ? (
                      <span className="flex items-center text-yellow-700 text-sm">
                        <AlertTriangle size={14} className="mr-1" /> หลักฐานไม่ครบ {item.warnings} รายการ
                      </span>
                    ) : (
                      <span className="text-emerald-700 text-sm">หลักฐานครบ</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* [BENCHMARK] Industry Benchmark */}
      {!loading && (
        <Card className="shadow-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                Industry Benchmark – {profile?.industry_section || "N/A"} (ปี {year})
              </h3>
              {companyA && indA ? (
                <div className="text-sm text-gray-600">
                  Your Company: {Math.round(companyA.total_score)} / {companyA.max_score} •{" "}
                  Industry Avg: {Math.round(Number(indA.avg_score))} / {Math.round(Number(indA.avg_max_score))} •{" "}
                  Difference:{" "}
                  <span className={Number(diffText) >= 0 ? "text-emerald-700" : "text-red-700"}>
                    {diffText}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  {profile?.industry_section
                    ? "ยังไม่มีข้อมูลเฉลี่ยของอุตสาหกรรมปีนี้"
                    : "ยังไม่ตั้งค่าอุตสาหกรรมในโปรไฟล์"}
                </div>
              )}
            </div>

            {benchmarkBarData.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={benchmarkBarData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-gray-500">ไม่มีข้อมูลสำหรับเปรียบเทียบ</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ✅ Export แบบ client-only (ปิด SSR เฉพาะหน้า dashboard)
export default dynamic(() => Promise.resolve(DashboardPageImpl), { ssr: false });
