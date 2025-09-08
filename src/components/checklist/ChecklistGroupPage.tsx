// src/components/checklist/ChecklistGroupPage.tsx
'use client';
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  loadItems,
  toggleRecord,
  saveText as svcSaveText,
  uploadEvidence as svcUploadEvidence,
  replaceEvidence as svcReplaceEvidence,
  removeEvidence as svcRemoveEvidence,
  signedUrl as svcSignedUrl,
  getStatus,
  calcSummary,
  fmtDate,
  type ChecklistItem,
  type CategoryKey,
} from "@/services/checklistService";
import {
  Loader2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Eye,
  Trash2,
} from "lucide-react";

/** ===== Moonship Accents (inline) ===== */
const ACCENT_BY_CATEGORY: Record<CategoryKey, string> = {
  strategy: "#FFD54A",
  structure: "#2DD4BF",
  sop: "#7C3AED",
  hr: "#22C55E",
  finance: "#F59E0B",
  sales: "#FF7A1A",
};

/** ===== Mission status (GO/HOLD/NO-GO) ===== */
type MissionStatus = "GO" | "HOLD" | "NO-GO";
const toMissionStatus = (it: ChecklistItem): MissionStatus => {
  if (it.has_record && it.has_evidence) return "GO";
  if (it.has_record && !it.has_evidence) return "HOLD";
  return "NO-GO";
};

function StatusChip({ status }: { status: MissionStatus }) {
  const base =
    "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition";
  if (status === "GO")
    return (
      <span className={`${base} text-emerald-400 border-emerald-500/40 bg-emerald-500/10`}>
        ● GO
      </span>
    );
  if (status === "HOLD")
    return (
      <span className={`${base} text-amber-300 border-amber-400/40 bg-amber-500/10`}>
        ● HOLD
      </span>
    );
  return (
    <span className={`${base} text-rose-300 border-rose-400/40 bg-rose-500/10`}>
      ● NO-GO
    </span>
  );
}

/** ===== Evidence Quality (manual, LocalStorage) ===== */
type EvidenceQuality = "good" | "fair" | "needs_work" | "";
const QUALITY_LABEL: Record<Exclude<EvidenceQuality, "">, string> = {
  good: "ดี",
  fair: "พอใช้",
  needs_work: "ต้องปรับ",
};
const qualityKey = (year: number, id: string) => `eq:${year}:${id}`;
const readQuality = (year: number, id: string): EvidenceQuality => {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem(qualityKey(year, id)) as EvidenceQuality) || "";
};
const writeQuality = (year: number, id: string, q: EvidenceQuality) => {
  if (typeof window === "undefined") return;
  if (q) localStorage.setItem(qualityKey(year, id), q);
  else localStorage.removeItem(qualityKey(year, id));
};
function QualityTag({ q }: { q: EvidenceQuality }) {
  if (!q) return null;
  const map: Record<Exclude<EvidenceQuality, "">, string> = {
    good: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10",
    fair: "text-sky-300 border-sky-400/40 bg-sky-500/10",
    needs_work: "text-amber-300 border-amber-400/40 bg-amber-500/10",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${map[q]}`}>
      {QUALITY_LABEL[q]}
    </span>
  );
}

/** ===== Segmented Filter (with hotkeys 1..4) ===== */
type FilterKey = "all" | "not_started" | "checked_no_file" | "completed";
const segments: { key: FilterKey; label: string; tone: "slate" | "rose" | "amber" | "emerald" }[] =
  [
    { key: "all", label: "ทั้งหมด", tone: "slate" },
    { key: "not_started", label: "NO-GO", tone: "rose" },
    { key: "checked_no_file", label: "HOLD", tone: "amber" },
    { key: "completed", label: "GO", tone: "emerald" },
  ];

function Segmented({
  value,
  onChange,
}: {
  value: FilterKey;
  onChange: (k: FilterKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="ตัวกรองสถานะ"
      className="inline-flex rounded-full border border-white/10 bg-white/5 p-1"
    >
      {segments.map((s) => {
        const active = value === s.key;
        const tone =
          s.tone === "emerald"
            ? "text-emerald-300"
            : s.tone === "amber"
            ? "text-amber-300"
            : s.tone === "rose"
            ? "text-rose-300"
            : "text-slate-200";
        return (
          <button
            key={s.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm transition ${
              active
                ? `bg-white/10 border border-white/10 ${tone}`
                : "hover:bg-white/10 text-slate-200"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/** ===== Props ===== */
export type ChecklistGroupPageProps = {
  groupNo: 1 | 2 | 3 | 4 | 5 | 6;
  categoryKey: CategoryKey;
  title: string;
  breadcrumb?: string;
  requireEvidence?: boolean;
  storageBucket?: string;
};

const DEFAULT_BUCKET = "evidence";

/** ---------- Title Overrides ---------- */
type TitleDesc = { title: string; desc?: string };
const STRATEGY_OVERRIDES: TitleDesc[] = [
  { title: "Vision (วิสัยทัศน์)", desc: "ภาพอนาคตที่องค์กรอยากไปให้ถึง" },
  { title: "Mission (พันธกิจ)", desc: "สิ่งที่องค์กรทำ/ส่งมอบให้กับลูกค้าและสังคม" },
  { title: "Core Values (ค่านิยมหลัก)", desc: "คุณค่าที่บุคลากรยึดถือร่วมกัน" },
  { title: "Strategic Objectives (วัตถุประสงค์เชิงกลยุทธ์)", desc: "เป้าหมายใหญ่ที่สอดคล้องกับวิสัยทัศน์" },
  { title: "SWOT / TOWS", desc: "จุดแข็ง–จุดอ่อน–โอกาส–อุปสรรค และทางเลือกเชิงกลยุทธ์" },
  { title: "Stakeholders & Needs", desc: "ผู้มีส่วนได้ส่วนเสียหลักและความคาดหวัง" },
  { title: "Critical Success Factors – CSF", desc: "ปัจจัยสู่ความสำเร็จขององค์กร" },
  { title: "Strategic Initiatives / Projects", desc: "โครงการ/แผนงานเชิงกลยุทธ์ที่กำลังดำเนินการ" },
  { title: "KPI Alignment (Lead–Lag) & Targets", desc: "เชื่อม KPI กับกลยุทธ์และกำหนดเป้าหมาย" },
];
const STRUCTURE_OVERRIDES: TitleDesc[] = [
  { title: "Org Chart", desc: "แผนผังโครงสร้างองค์กรและสายบังคับบัญชา" },
  { title: "Board & Executives", desc: "คณะกรรมการ/ผู้บริหารและบทบาทหน้าที่" },
  { title: "Roles & Responsibilities", desc: "การมอบหมายความรับผิดชอบชัดเจน" },
  { title: "KPI/OKR Review Cadence", desc: "รอบการติดตามผลการทำงานของหน่วยงาน/บุคคล" },
  { title: "Governance & Code of Conduct", desc: "นโยบายธรรมาภิบาลและจรรยาบรรณธุรกิจ" },
];
const SOP_OVERRIDES: TitleDesc[] = [
  { title: "Core Processes", desc: "ระบุและออกแบบกระบวนการหลักขององค์กร" },
  { title: "SOP/WI", desc: "คู่มือ/ขั้นตอนการทำงานสำหรับงานสำคัญ" },
  { title: "Process Map / Flowchart", desc: "แผนภาพแสดงลำดับงาน จุดควบคุม และอินพุต/เอาต์พุต" },
  { title: "Process KPIs", desc: "ตัวชี้วัดประสิทธิภาพต่อกระบวนการ" },
  { title: "Periodic Review & Improvement", desc: "ทบทวน/ปรับปรุง SOP/WI เป็นประจำ" },
];
const HR_OVERRIDES: TitleDesc[] = [
  { title: "Recruitment & Onboarding", desc: "รับสมัครและปฐมนิเทศพนักงานใหม่" },
  { title: "Employee Handbook", desc: "คู่มือพนักงาน/นโยบายบุคคล" },
  { title: "Performance & Feedback", desc: "ระบบประเมินผลและการให้ข้อเสนอแนะ" },
  { title: "Training / IDP", desc: "แผนพัฒนาศักยภาพรายบุคคล/ทีม" },
  { title: "Engagement & Culture", desc: "สร้างความผูกพันและค่านิยมในทางปฏิบัติ" },
];
const FINANCE_OVERRIDES: TitleDesc[] = [
  { title: "Annual Budget", desc: "งบประมาณประจำปีและแผนการเงิน" },
  { title: "Financial Reports (P&L, Cash Flow)", desc: "รายงานการเงินหลัก" },
  { title: "Budget vs Actual", desc: "การติดตามผลเทียบเป้าหมาย" },
  { title: "Financial KPIs", desc: "ตัวชี้วัดทางการเงินหลัก" },
  { title: "Data Analysis / Dashboard", desc: "การใช้ข้อมูลเพื่อการตัดสินใจ" },
];
const SALES_OVERRIDES: TitleDesc[] = [
  { title: "Customer Segmentation / Persona", desc: "ทำความเข้าใจลูกค้าเป้าหมาย" },
  { title: "Customer Journey & Experience", desc: "ออกแบบประสบการณ์และจุดสัมผัส" },
  { title: "Feedback & Satisfaction", desc: "ระบบรับฟังเสียงลูกค้า/ความพึงพอใจ" },
  { title: "Sales Data & Market Analysis", desc: "ข้อมูลยอดขายและการวิเคราะห์ตลาด" },
  { title: "Marketing & Sales Plan", desc: "แผนการตลาดและการขายประจำปี" },
];
const TITLE_OVERRIDES: Record<CategoryKey, TitleDesc[] | null> = {
  strategy: STRATEGY_OVERRIDES,
  structure: STRUCTURE_OVERRIDES,
  sop: SOP_OVERRIDES,
  hr: HR_OVERRIDES,
  finance: FINANCE_OVERRIDES,
  sales: SALES_OVERRIDES,
};

/** ===== Component ===== */
export default function ChecklistGroupPage({
  groupNo,
  categoryKey,
  title,
  breadcrumb,
  requireEvidence = false,
  storageBucket = DEFAULT_BUCKET,
}: ChecklistGroupPageProps) {
  const router = useRouter();
  const year = useMemo(() => {
    const y = Number(router.query.year ?? new Date().getFullYear());
    return Number.isFinite(y) ? y : new Date().getFullYear();
  }, [router.query.year]);

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [qualities, setQualities] = useState<Record<string, EvidenceQuality>>({});

  /** Load items */
  const load = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const rows = await loadItems({ year, category: categoryKey });
      setItems(rows);
      // seed drafts
      setDrafts((prev) => {
        const next = { ...prev };
        rows.forEach((it) => {
          if (next[it.template_id] === undefined) next[it.template_id] = it.input_text ?? "";
        });
        return next;
      });
      // seed quality from localStorage
      const q: Record<string, EvidenceQuality> = {};
      rows.forEach((it) => (q[it.template_id] = readQuality(year, it.template_id)));
      setQualities(q);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || "โหลดรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, categoryKey]);

  /** Summary & filters */
  const summary = useMemo(() => calcSummary(items, requireEvidence), [items, requireEvidence]);

  const visible = useMemo(() => {
    switch (filter) {
      case "not_started":
        return items.filter((it) => !it.has_record);
      case "checked_no_file":
        return items.filter((it) => it.has_record && !it.has_evidence);
      case "completed":
        return items.filter((it) => it.has_record && it.has_evidence);
      default:
        return items;
    }
  }, [items, filter]);

  /** Hotkeys 1..4 -> filter */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.target && (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "1") setFilter("all");
      if (e.key === "2") setFilter("not_started");
      if (e.key === "3") setFilter("checked_no_file");
      if (e.key === "4") setFilter("completed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Actions */
  const onToggleItem = async (it: ChecklistItem, next: boolean) => {
    setSavingId(it.template_id);
    try {
      await toggleRecord({ template_id: it.template_id, year, name: it.name, next });
      await load();
    } catch (e: any) {
      console.error(e);
      alert("บันทึกไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setSavingId(null);
    }
  };

  const onUploadEvidence = async (it: ChecklistItem, file: File) => {
    setSavingId(it.template_id);
    try {
      await svcUploadEvidence({ template_id: it.template_id, year, name: it.name, file, bucket: storageBucket });
      await load();
    } catch (e: any) {
      console.error(e);
      alert("อัปโหลดไฟล์ไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setSavingId(null);
    }
  };
  const onReplaceEvidence = async (it: ChecklistItem, file: File) => {
    setSavingId(it.template_id);
    try {
      await svcReplaceEvidence({
        template_id: it.template_id,
        year,
        name: it.name,
        file,
        oldKey: it.file_key ?? undefined,
        bucket: storageBucket,
      });
      await load();
    } catch (e: any) {
      console.error(e);
      alert("เปลี่ยนไฟล์ไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setSavingId(null);
    }
  };
  const onRemoveEvidence = async (it: ChecklistItem) => {
    if (!it.file_key) return;
    if (!confirm("ยืนยันลบไฟล์แนบข้อนี้?")) return;
    setSavingId(it.template_id);
    try {
      await svcRemoveEvidence({ template_id: it.template_id, year, key: it.file_key, bucket: storageBucket });
      await load();
    } catch (e: any) {
      console.error(e);
      alert("ลบไฟล์ไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setSavingId(null);
    }
  };
  const onViewEvidence = async (it: ChecklistItem) => {
    if (!it.file_key) {
      alert("ยังไม่มีไฟล์ในข้อนี้");
      return;
    }
    try {
      const url = await svcSignedUrl({ key: it.file_key, bucket: storageBucket, expiresInSec: 60 * 5 });
      window.open(url, "_blank");
    } catch (e: any) {
      console.error(e);
      alert("เปิดไฟล์ไม่สำเร็จ: " + (e?.message || "unknown"));
    }
  };

  const onSaveText = async (it: ChecklistItem) => {
    setSavingId(it.template_id);
    try {
      const text = (drafts[it.template_id] ?? it.input_text ?? "").trim();
      await svcSaveText({ template_id: it.template_id, year, name: it.name, text });
      await load();
    } catch (e: any) {
      console.error(e);
      alert("บันทึกไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setSavingId(null);
    }
  };

  /** Helpers */
  const getDisplayName = (origName: string, index: number) => {
    const list = TITLE_OVERRIDES[categoryKey];
    const order = `${groupNo}.${index + 1}• `;
    if (list && list[index]) {
      const { title, desc } = list[index];
      return `${order}${title}${desc ? ` – ${desc}` : ""}`;
    }
    return `${order}${origName}`;
  };

  const accent = ACCENT_BY_CATEGORY[categoryKey] ?? "#A1A1AA";

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,#0B0F1A,#0F1E2E)] min-h-screen p-6 md:p-10 text-slate-100">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs text-slate-400">{breadcrumb || `Checklist › หมวด ${groupNo}`}</div>
        <h1 className="mt-1 text-2xl font-bold" style={{ textShadow: "0 0 24px rgba(255,255,255,0.08)" }}>
          {title}
        </h1>
        <div className="mt-1 text-xs text-slate-400">ปี {year} · สถานะภารกิจหมวดนี้</div>
      </div>

      {/* (1) Sticky Summary Bar */}
      <div
        className="sticky top-0 z-30 -mx-6 md:-mx-10 px-6 md:px-10 py-3 border-b"
        style={{
          background: "rgba(11,15,26,0.6)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Segmented + legend */}
          <div className="flex items-center gap-3">
            {/* (2) Segmented Filter */}
            <Segmented value={filter} onChange={setFilter} />
            <div className="hidden md:flex text-[11px] text-slate-400 gap-3">
              <span>กด 1–4 เพื่อสลับตัวกรอง</span>
            </div>
          </div>

          {/* Summary small cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto">
            <div className="rounded-lg border px-3 py-2 text-right" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)" }}>
              <div className="text-[11px] text-slate-300">GO (เสร็จ + มีไฟล์)</div>
              <div className="text-lg font-bold">{summary.completed}</div>
            </div>
            <div className="rounded-lg border px-3 py-2 text-right" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)" }}>
              <div className="text-[11px] text-slate-300">HOLD (ติ๊กไม่มีไฟล์)</div>
              <div className="text-lg font-bold">{summary.checkedNoFile}</div>
            </div>
            <div className="rounded-lg border px-3 py-2 text-right" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)" }}>
              <div className="text-[11px] text-slate-300">NO-GO (ยังไม่เริ่ม)</div>
              <div className="text-lg font-bold">{summary.notStarted}</div>
            </div>
            <div className="rounded-lg border px-3 py-2 text-right" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)" }}>
              <div className="text-[11px] text-slate-300">
                ความครบถ้วน{requireEvidence ? " (นับเฉพาะมีไฟล์)" : ""}
              </div>
              <div className="text-xl font-extrabold" style={{ color: accent }}>
                {summary.pct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error / Loading */}
      {errorMsg && (
        <div className="mt-4 mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-200">
          {errorMsg}
        </div>
      )}
      {loading && (
        <div className="mt-4 flex items-center gap-2 text-slate-300">
          <Loader2 className="animate-spin" size={18} /> กำลังเตรียมหัวข้อ…
        </div>
      )}

      {/* Items */}
      {!loading && items.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-slate-300">
          ยังไม่มีหัวข้อของปีนี้
        </div>
      )}

      <ul className="mt-4 space-y-4 pb-24">
        {visible.map((it, idx) => {
          const legacyStatus = getStatus(it);
          const stateIcon =
            legacyStatus === "green" ? (
              <CheckCircle2 className="text-emerald-400" size={18} />
            ) : legacyStatus === "yellow" ? (
              <AlertTriangle className="text-amber-300" size={18} />
            ) : (
              <Circle className="text-slate-400" size={18} />
            );

          const displayName = getDisplayName(it.name, idx);
          const missionStatus = toMissionStatus(it);
          const q = qualities[it.template_id] || "";

          return (
            <li
              key={it.template_id}
              className="p-4 rounded-xl shadow-sm border"
              style={{
                borderColor:
                  missionStatus === "GO"
                    ? "rgba(16,185,129,0.35)"
                    : missionStatus === "HOLD"
                    ? "rgba(245,158,11,0.35)"
                    : "rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {stateIcon}
                  <div>
                    <div className="font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>
                      {displayName}
                    </div>
                    <div className="text-xs text-slate-300">
                      คะแนนข้อนี้: +{it.score_points} • อัปเดตล่าสุด: {fmtDate(it.updated_at)}
                    </div>

                    {/* File row + Evidence Quality (4) */}
                    {it.has_evidence && it.file_path ? (
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-emerald-300/90">ไฟล์: {it.file_path}</span>

                        <button
                          type="button"
                          onClick={() => onViewEvidence(it)}
                          className="inline-flex items-center gap-1 underline text-sky-300 hover:text-sky-200"
                          title="ดูไฟล์"
                        >
                          <Eye size={14} /> ดูไฟล์
                        </button>

                        <label
                          className="inline-flex cursor-pointer items-center gap-1 underline text-slate-200 hover:text-slate-100"
                          title="เปลี่ยนไฟล์"
                        >
                          <Upload size={14} /> เปลี่ยนไฟล์
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) onReplaceEvidence(it, f);
                            }}
                            disabled={savingId === it.template_id}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => onRemoveEvidence(it)}
                          className="inline-flex items-center gap-1 underline text-rose-300 hover:text-rose-200"
                          title="ลบไฟล์"
                        >
                          <Trash2 size={14} /> ลบไฟล์
                        </button>

                        {/* Evidence quality tag + select */}
                        <QualityTag q={q} />
                        <select
                          value={q}
                          onChange={(e) => {
                            const v = e.target.value as EvidenceQuality;
                            writeQuality(year, it.template_id, v);
                            setQualities((prev) => ({ ...prev, [it.template_id]: v }));
                          }}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200"
                          title="คุณภาพหลักฐาน"
                        >
                          <option value="">— คุณภาพหลักฐาน —</option>
                          <option value="good">ดี</option>
                          <option value="fair">พอใช้</option>
                          <option value="needs_work">ต้องปรับ</option>
                        </select>
                      </div>
                    ) : missionStatus === "HOLD" ? (
                      <div className="mt-1 text-xs text-amber-200">
                        ติ๊กแล้วแต่ยังไม่มีหลักฐาน — อัปโหลดไฟล์เพื่อปลดล็อกคะแนนเต็ม
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* actions + chip */}
                <div className="flex items-center gap-3">
                  <StatusChip status={missionStatus} />

                  <label className="flex select-none items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={!!it.has_record}
                      onChange={(e) => onToggleItem(it, e.target.checked)}
                      disabled={savingId === it.template_id}
                    />
                    ติ๊กแล้ว
                  </label>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                    <Upload size={16} />
                    <span>แนบไฟล์</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadEvidence(it, f);
                      }}
                      disabled={savingId === it.template_id}
                    />
                  </label>
                </div>
              </div>

              {/* textarea (5) — readable with subtle divider */}
              <div className="mt-3">
                <div
                  className="rounded-lg border border-white/10 bg-white/5"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
                >
                  <textarea
                    className="w-full bg-transparent p-3 text-sm text-slate-100 placeholder:text-slate-400"
                    rows={3}
                    placeholder="พิมพ์บันทึก/สรุปหลักฐาน… (เพิ่ม Δv ให้ยานของคุณ)"
                    value={drafts[it.template_id] ?? it.input_text ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [it.template_id]: e.target.value }))
                    }
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => onSaveText(it)}
                    disabled={savingId === it.template_id}
                    className="rounded bg-yellow-400/90 text-black px-4 py-2 text-sm font-semibold hover:bg-yellow-300"
                    style={{ boxShadow: `0 0 18px ${accent}40` }}
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
