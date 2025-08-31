// src/components/checklist/SummaryPage.tsx
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/utils/supabaseClient";
import { Trophy, Info, Target, Download } from "lucide-react";

type CategoryKey = "strategy" | "structure" | "sop" | "hr" | "finance" | "sales";

type CatRow = {
  category: string;                 // key ชื่อหมวดจาก RPC
  score: number;                    // คะแนนที่ได้ของหมวด
  max_score_category: number;       // คะแนนเต็มของหมวด
  evidence_rate_pct: number;        // %Progress ของหมวด (0–100)
};

type TotalRow = {
  total_score: number;              // คะแนนรวมทุกหมวด
  max_score: number;                // คะแนนเต็มรวม (ควรเป็น 600)
  tier_label: "Excellent" | "Developing" | "Early Stage";
};

const MAIN_CAT_KEYS: CategoryKey[] = ["strategy", "structure", "sop", "hr", "finance", "sales"];
const CAT_LABEL: Record<CategoryKey, string> = {
  strategy: "กลยุทธ์องค์กร",
  structure: "โครงสร้างองค์กร",
  sop: "คู่มือปฏิบัติงาน",
  hr: "ระบบบุคคล & HR",
  finance: "ระบบการเงิน",
  sales: "ระบบลูกค้า / ขาย",
};
const CAT_COLORS: Record<CategoryKey, string> = {
  strategy: "#3B82F6",
  structure: "#10B981",
  sop: "#8B5CF6",
  hr: "#F59E0B",
  finance: "#EAB308",
  sales: "#EC4899",
};

// เกณฑ์ค่าเริ่มต้น (v1.6)
const ORG_PASS = { scorePct: 70, progressPct: 80 };
const ORG_EXCELLENT = { scorePct: 85, progressPct: 90 };
const SECTION_FLOOR = { scorePct: 60, progressPct: 70 };

function pct(n: number) {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}%`;
}
function tierThai(t: TotalRow["tier_label"]) {
  if (t === "Excellent") return "Excellent";
  if (t === "Developing") return "Developing";
  return "Early Stage";
}
// CSV helpers
const csvEsc = (v: any) => {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

function SummaryPageImpl() {
  const { uid } = useUserProfile();
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(thisYear);

  const [total, setTotal] = useState<TotalRow | null>(null);
  const [rows, setRows] = useState<Record<CategoryKey, CatRow | null>>({
    strategy: null, structure: null, sop: null, hr: null, finance: null, sales: null,
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // โหลดปีที่มีข้อมูล
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.rpc("fn_available_years_for_me");
      if (!mounted) return;
      if (error) { setErr(error.message); return; }
      const years = (data || []).map((r: any) => Number(r.year_version)).filter(Boolean);
      setAvailableYears(years.length ? years : [thisYear]);
      if (years.length) setYear((y) => (years.includes(y) ? y : years[0]));
    })();
    return () => { mounted = false; };
  }, [uid]);

  // โหลดรวม + ต่อหมวด (นับ Progress แบบ requireEvidence=true)
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const [{ data: tot, error: e1 }, { data: catRows, error: e2 }] = await Promise.all([
          supabase.rpc("fn_score_total_for_me", { p_year: year, p_require_evidence: true }),
          supabase.rpc("fn_score_by_category_for_me", { p_year: year, p_require_evidence: true }),
        ]);
        if (e1) throw e1; if (e2) throw e2;
        if (!mounted) return;

        setTotal((tot as TotalRow[] | null)?.[0] ?? null);

        const byCat: Record<CategoryKey, CatRow | null> = {
          strategy: null, structure: null, sop: null, hr: null, finance: null, sales: null,
        };
        (catRows as CatRow[] | null)?.forEach((r) => {
          const key = String(r.category).trim().toLowerCase() as CategoryKey;
          if (MAIN_CAT_KEYS.includes(key)) byCat[key] = r;
        });
        setRows(byCat);
      } catch (e: any) {
        console.error(e); setErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [uid, year]);

  // Score% รวม (จาก 600)
  const scorePctOverall = useMemo(() => {
    if (!total) return 0;
    const p = (Number(total.total_score) / Math.max(1, Number(total.max_score))) * 100;
    return Math.max(0, Math.min(100, Math.round(p)));
  }, [total]);

  // Badge org-level (จาก Score% รวมที่มี)
  const orgBadge = useMemo(() => {
    if (scorePctOverall >= ORG_EXCELLENT.scorePct) return { label: "เข้าเป้า Excellent (Score)", className: "bg-emerald-100 text-emerald-700" };
    if (scorePctOverall >= ORG_PASS.scorePct) return { label: "ผ่านขั้นต่ำ (Score)", className: "bg-blue-100 text-blue-700" };
    return { label: "ยังไม่ผ่าน (Score)", className: "bg-amber-100 text-amber-700" };
  }, [scorePctOverall]);

  // === Export CSV ===
  const handleExportCSV = () => {
    // ส่วนหัว metadata
    const meta: string[][] = [
      ["Report", "OwnerOS Summary v1.6 Balanced"],
      ["Year", String(year)],
      ["GeneratedAt", new Date().toISOString()],
      [],
    ];

    // หัวตาราง
    const header = ["CategoryKey", "CategoryNameTH", "ScoreObtained", "ScoreMax", "ScorePct(%)", "ProgressPct(%)", "SectionStatus"];

    // เนื้อหา: ต่อหมวด
    const body: string[][] = MAIN_CAT_KEYS.map((k) => {
      const r = rows[k];
      const max = Number(r?.max_score_category ?? 0);
      const score = Number(r?.score ?? 0);
      const scorePct = max > 0 ? Math.round((score / max) * 100) : 0;
      const progressPct = Math.max(0, Math.min(100, Math.round(Number(r?.evidence_rate_pct ?? 0))));
      const passed = scorePct >= SECTION_FLOOR.scorePct && progressPct >= SECTION_FLOOR.progressPct;
      return [
        k,
        CAT_LABEL[k],
        isFinite(score) ? String(score) : "",
        isFinite(max) ? String(max) : "",
        String(scorePct),
        String(progressPct),
        passed ? "PASS" : "FAIL",
      ];
    });

    const rowsAll = [...meta, header, ...body];
    const csv = rowsAll.map((row) => row.map(csvEsc).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }); // \ufeff = BOM เพื่อภาษาไทยใน Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `owneros_summary_${year}_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">สรุปภาพรวม (Summary) – v1.6 Balanced</h1>
          <p className="text-slate-600">แยก “Score%” (คุณภาพ/น้ำหนัก) ออกจาก “%Progress” (งานเสร็จจริง)</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">ปี:</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded-md px-2 py-2">
            {availableYears.map((y) => <option key={y} value={y}>ปี {y}</option>)}
          </select>
        </div>
      </div>

      {/* Definitions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold"><Target size={18} /> Score%</div>
          <p className="text-sm text-slate-600 mt-1">
            วัดคุณภาพ/ความครบถ้วน (ถ่วงน้ำหนัก) = (คะแนนรวม ÷ 600) × 100
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold"><Info size={18} /> %Progress</div>
          <p className="text-sm text-slate-600 mt-1">
            วัดความคืบหน้าเชิงปริมาณ = (จำนวนข้อที่ “ติ๊ก+มีหลักฐาน” ÷ จำนวนข้อทั้งหมด) × 100
          </p>
          <p className="text-xs text-slate-500 mt-1">* เปิดโหมดนับหลักฐาน: requireEvidence = true</p>
        </Card>
        <Card className="p-4">
          <div className="text-slate-800 font-semibold">เกณฑ์ค่าเริ่มต้น</div>
          <ul className="text-sm text-slate-700 mt-1 space-y-1">
            <li>องค์กร: ผ่านขั้นต่ำ = <b>Score ≥ {ORG_PASS.scorePct}%</b> และ <b>%Progress ≥ {ORG_PASS.progressPct}%</b></li>
            <li>องค์กร: Excellent = <b>Score ≥ {ORG_EXCELLENT.scorePct}%</b> และ <b>%Progress ≥ {ORG_EXCELLENT.progressPct}%</b></li>
            <li>ระดับหมวด (Floor) = <b>Score ≥ {SECTION_FLOOR.scorePct}%</b> และ <b>%Progress ≥ {SECTION_FLOOR.progressPct}%</b></li>
          </ul>
        </Card>
      </div>

      {/* Overall Score% */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Trophy size={18} className="text-yellow-600" />
            <span className="font-medium">Score% รวมทั้งองค์กร (ปี {year})</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs ${orgBadge.className}`}>{orgBadge.label}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">{pct(scorePctOverall)}</div>
          <div className="text-slate-600">{total ? tierThai(total.tier_label) : "-"}</div>
        </div>
        <div className="mt-2 w-full bg-gray-200/70 h-3 rounded-full overflow-hidden">
          <div className="h-3 rounded-full" style={{ width: `${scorePctOverall}%`, background: "linear-gradient(90deg,#34d399,#22c55e)" }} />
        </div>
      </Card>

      {/* Error / Loading */}
      {err && <Card className="p-4 border-red-300 text-red-700 bg-red-50">เกิดข้อผิดพลาด: {err}</Card>}
      {loading && <Card className="p-4">กำลังโหลดข้อมูล…</Card>}

      {/* Table per-category + Export */}
      {!loading && (
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
            <div className="font-medium text-slate-700">รายละเอียดรายหมวด</div>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-500"
              title="ส่งออก CSV"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3">หมวด</th>
                  <th className="text-right px-4 py-3">Score (ได้/เต็ม)</th>
                  <th className="text-right px-4 py-3">Score%</th>
                  <th className="text-right px-4 py-3">%Progress</th>
                  <th className="text-center px-4 py-3">สถานะหมวด</th>
                </tr>
              </thead>
              <tbody>
                {MAIN_CAT_KEYS.map((k) => {
                  const r = rows[k];
                  const max = Number(r?.max_score_category ?? 0);
                  const scorePct = max > 0 ? Math.round((Number(r?.score ?? 0) / max) * 100) : 0;
                  const progressPct = Math.max(0, Math.min(100, Math.round(Number(r?.evidence_rate_pct ?? 0))));
                  const passed = scorePct >= SECTION_FLOOR.scorePct && progressPct >= SECTION_FLOOR.progressPct;
                  return (
                    <tr key={k} className="border-t">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLORS[k] }} />
                          {CAT_LABEL[k]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {r ? `${Number(r.score)}/${Number(r.max_score_category)}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{pct(scorePct)}</td>
                      <td className="px-4 py-3 text-right">{pct(progressPct)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {passed ? "ผ่านขั้นต่ำ" : "ยังไม่ผ่าน"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t text-xs text-slate-600">
            * สถานะหมวด “ผ่านขั้นต่ำ” = Score ≥ {SECTION_FLOOR.scorePct}% และ %Progress ≥ {SECTION_FLOOR.progressPct}%<br />
            ** เกณฑ์องค์กร: ผ่านขั้นต่ำ {ORG_PASS.scorePct}/{ORG_PASS.progressPct} • Excellent {ORG_EXCELLENT.scorePct}/{ORG_EXCELLENT.progressPct}
          </div>
        </Card>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(SummaryPageImpl), { ssr: false });
