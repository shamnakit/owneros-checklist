// src/components/checklist/SummaryPage.tsx
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/utils/supabaseClient";
import { Trophy, Info, Target, Download } from "lucide-react";

type CategoryKey = "strategy" | "structure" | "sop" | "hr" | "finance" | "sales";

type CatRow = {
  category: string;
  score: number;
  max_score_category: number;
  evidence_rate_pct: number;
};

type TotalRow = {
  total_score: number;
  max_score: number;
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
    if (scorePctOverall >= ORG_EXCELLENT.scorePct) return { label: "เข้าเป้า Excellent (Score)", className: "badge-soft text-emerald-300 border-emerald-400/40" };
    if (scorePctOverall >= ORG_PASS.scorePct) return { label: "ผ่านขั้นต่ำ (Score)", className: "badge-soft text-sky-300 border-sky-400/40" };
    return { label: "ยังไม่ผ่าน (Score)", className: "badge-soft text-amber-300 border-amber-400/40" };
  }, [scorePctOverall]);

  // === Export CSV ===
  const handleExportCSV = (e?: React.MouseEvent<HTMLButtonElement>) => {
    try {
      e?.preventDefault();
      e?.stopPropagation();

      const meta: string[][] = [
        ["Report", "OwnerOS Summary v1.6 Balanced"],
        ["Year", String(year)],
        ["GeneratedAt", new Date().toISOString()],
        [],
      ];

      const header = ["CategoryKey", "CategoryNameTH", "ScoreObtained", "ScoreMax", "ScorePct(%)", "ProgressPct(%)", "SectionStatus"];

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
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }); // BOM ไทย
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `owneros_summary_${year}_${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export CSV failed:", err);
      alert("Export ไม่สำเร็จ: " + (err?.message || "ไม่ทราบสาเหตุ"));
    }
  };

  return (
    // ⬇️ เต็มกว้าง + ใช้สีตัวอักษรแบบ dark
    <div className="w-full !max-w-none p-6 md:p-8 space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">สรุปภาพรวม (Summary) – v1.6 Balanced</h1>
          <p className="subtle">แยก “Score%” (คุณภาพ/น้ำหนัก) ออกจาก “%Progress” (งานเสร็จจริง)</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm subtle">ปี:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input-dark px-2 py-2"
          >
            {availableYears.map((y) => <option key={y} value={y} className="bg-[#0B0F1A]">ปี {y}</option>)}
          </select>
        </div>
      </div>

      {/* Definitions */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="surface p-4">
          <div className="flex items-center gap-2 font-semibold"><Target size={18} /> Score%</div>
          <p className="text-sm muted mt-1">
            วัดคุณภาพ/ความครบถ้วน (ถ่วงน้ำหนัก) = (คะแนนรวม ÷ 600) × 100
          </p>
        </div>
        <div className="surface p-4">
          <div className="flex items-center gap-2 font-semibold"><Info size={18} /> %Progress</div>
          <p className="text-sm muted mt-1">
            วัดความคืบหน้าเชิงปริมาณ = (จำนวนข้อที่ “ติ๊ก+มีหลักฐาน” ÷ จำนวนข้อทั้งหมด) × 100
          </p>
          <p className="text-xs subtle mt-1">* เปิดโหมดนับหลักฐาน: requireEvidence = true</p>
        </div>
        <div className="surface p-4">
          <div className="font-semibold">เกณฑ์ค่าเริ่มต้น</div>
          <ul className="text-sm mt-1 space-y-1">
            <li>องค์กร: ผ่านขั้นต่ำ = <b>Score ≥ {ORG_PASS.scorePct}%</b> และ <b>%Progress ≥ {ORG_PASS.progressPct}%</b></li>
            <li>องค์กร: Excellent = <b>Score ≥ {ORG_EXCELLENT.scorePct}%</b> และ <b>%Progress ≥ {ORG_EXCELLENT.progressPct}%</b></li>
            <li>ระดับหมวด (Floor) = <b>Score ≥ {SECTION_FLOOR.scorePct}%</b> และ <b>%Progress ≥ {SECTION_FLOOR.progressPct}%</b></li>
          </ul>
        </div>
      </div>

      {/* Overall Score% */}
      <div className="surface p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-yellow-300" />
            <span className="font-medium">Score% รวมทั้งองค์กร (ปี {year})</span>
          </div>
          <span className={orgBadge.className}>{orgBadge.label}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="metric-number">{pct(scorePctOverall)}</div>
          <div className="subtle">{total ? tierThai(total.tier_label) : "-"}</div>
        </div>

        <div className="mt-3 w-full h-3 overflow-hidden rounded-full progress-track">
          <div
            className="h-3 rounded-full progress-quality"
            style={{ width: `${scorePctOverall}%` }}
          />
        </div>
      </div>

      {/* Error / Loading */}
      {err && <div className="surface p-4 border border-red-400/40 text-red-300">เกิดข้อผิดพลาด: {err}</div>}
      {loading && <div className="surface p-4">กำลังโหลดข้อมูล…</div>}

      {/* Table per-category + Export */}
      {!loading && (
        <div className="surface p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
            <div className="font-medium">รายละเอียดรายหมวด</div>
            <button
              type="button"
              onClick={(e) => handleExportCSV(e)}
              className="btn-primary inline-flex items-center gap-1 text-sm"
              title="ส่งออก CSV"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
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
                    <tr key={k} className="border-t border-[var(--line)]">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: CAT_COLORS[k] }} />
                          {CAT_LABEL[k]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{r ? `${Number(r.score)}/${Number(r.max_score_category)}` : "-"}</td>
                      <td className="px-4 py-3 text-right font-medium">{pct(scorePct)}</td>
                      <td className="px-4 py-3 text-right">{pct(progressPct)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`badge-soft ${passed ? "text-emerald-300 border-emerald-400/40" : "text-amber-300 border-amber-400/40"}`}>
                          {passed ? "ผ่านขั้นต่ำ" : "ยังไม่ผ่าน"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[var(--line)] text-xs subtle">
            * สถานะหมวด “ผ่านขั้นต่ำ” = Score ≥ {SECTION_FLOOR.scorePct}% และ %Progress ≥ {SECTION_FLOOR.progressPct}%<br />
            ** เกณฑ์องค์กร: ผ่านขั้นต่ำ {ORG_PASS.scorePct}/{ORG_PASS.progressPct} • Excellent {ORG_EXCELLENT.scorePct}/{ORG_EXCELLENT.progressPct}
          </div>
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(SummaryPageImpl), { ssr: false });
