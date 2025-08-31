// src/components/checklist/ChecklistGroupPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  loadItems,
  listYears,
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
import { Loader2, Upload, CheckCircle2, AlertTriangle, Circle, Eye, Trash2 } from "lucide-react";

export type ChecklistGroupPageProps = {
  groupNo: 1 | 2 | 3 | 4 | 5 | 6;
  categoryKey: CategoryKey;
  title: string;               // เช่น "Checklist หมวด 2: โครงสร้างและการกำกับดูแล"
  breadcrumb?: string;         // เช่น "Checklist › หมวด 2"
  requireEvidence?: boolean;   // default=false (ติ๊กก็นับ) ; ถ้า true จะนับเฉพาะมีไฟล์
  storageBucket?: string;      // default="evidence"
};

type FilterKey = "all" | "not_started" | "checked_no_file" | "completed";

const DEFAULT_BUCKET = "evidence";

/* ----------------------------------------------------------------
 * OVERRIDES: ตั้งชื่อหัวข้อย่อยพร้อมคำอธิบายสำหรับทุกหมวด (1–6)
 * ระบบจะเติมลำดับอัตโนมัติ: {groupNo}.{index+1}• {title} – {desc}
 * ถ้าจำนวนรายการจริงไม่เท่ากับลิสต์นี้:
 *  - น้อยกว่า: ใช้เท่าที่มี
 *  - มากกว่า: รายการเกินจะใช้ชื่อเดิมจากฐานข้อมูล
 * ---------------------------------------------------------------- */
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

const badge = (text: string, active = false) =>
  `px-3 py-1.5 rounded-full text-sm ${active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`;

export default function ChecklistGroupPage({
  groupNo,
  categoryKey,
  title,
  breadcrumb,
  requireEvidence = false,
  storageBucket = DEFAULT_BUCKET,
}: ChecklistGroupPageProps) {
  const thisYear = new Date().getFullYear();
  const [years, setYears] = useState<number[]>([thisYear]);
  const [year, setYear] = useState<number>(thisYear);

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  /** โหลดรายชื่อปี */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ys = await listYears();
        if (!mounted) return;
        setYears(ys);
        setYear((y) => (ys.includes(y) ? y : ys[0]));
      } catch (e: any) {
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /** โหลดรายการ checklist ของหมวด */
  const load = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const rows = await loadItems({ year, category: categoryKey });
      setItems(rows);
      setDrafts((prev) => {
        const next = { ...prev };
        rows.forEach((it) => {
          if (next[it.template_id] === undefined) {
            next[it.template_id] = it.input_text ?? "";
          }
        });
        return next;
      });
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

  /** สรุปภาพรวมหมวด */
  const summary = useMemo(() => calcSummary(items, requireEvidence), [items, requireEvidence]);

  /** ฟิลเตอร์รายการ */
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

  /** ติ๊ก/ยกเลิก (manual) */
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

  /** อัปโหลดหลักฐาน (auto-check + evidence=true) */
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

  /** เปลี่ยนไฟล์ (ลบเก่า → อัปใหม่) */
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

  /** ลบไฟล์ */
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

  /** ดูไฟล์ (Signed URL) */
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

  /** บันทึกข้อความ (auto-check) */
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

  /** helper: แสดงชื่อหัวข้อ (รองรับ override + ลำดับ) */
  const getDisplayName = (origName: string, index: number) => {
    const list = TITLE_OVERRIDES[categoryKey];
    const order = `${groupNo}.${index + 1}• `;
    if (list && list[index]) {
      const { title, desc } = list[index];
      return `${order}${title}${desc ? ` – ${desc}` : ""}`;
    }
    return `${order}${origName}`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-slate-500">{breadcrumb || `Checklist › หมวด ${groupNo}`}</div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">ปี:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-md px-2 py-1"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 mb-6 rounded-xl bg-white border">
        <div className="flex items-center justify-between">
          <div className="text-slate-700 font-medium">
            ความคืบหน้าหมวดนี้: {summary.pct}% {requireEvidence ? "(นับเมื่อมีหลักฐาน)" : "(ติ๊กก็นับ)"}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>ครบพร้อมไฟล์: {summary.completed}</span>
            <span>• ติ๊กแล้วไม่มีไฟล์: {summary.checkedNoFile}</span>
            <span>• ยังไม่ทำ: {summary.notStarted}</span>
          </div>
        </div>
        <div className="mt-2 w-full bg-gray-200/70 h-2 rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full"
            style={{ width: `${summary.pct}%`, background: "linear-gradient(90deg,#60a5fa,#34d399)" }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">ครบพร้อมไฟล์: {summary.withFile} รายการ</div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <button className={badge("ทั้งหมด", filter === "all")} onClick={() => setFilter("all")}>
          ทั้งหมด
        </button>
        <button className={badge("ยังไม่ทำ", filter === "not_started")} onClick={() => setFilter("not_started")}>
          ยังไม่ทำ
        </button>
        <button
          className={badge("ติ๊กแล้วไม่มีไฟล์", filter === "checked_no_file")}
          onClick={() => setFilter("checked_no_file")}
        >
          ติ๊กแล้วไม่มีไฟล์
        </button>
        <button className={badge("ทำแล้วมีไฟล์", filter === "completed")} onClick={() => setFilter("completed")}>
          ทำแล้วมีไฟล์
        </button>
      </div>

      {/* Error / Loading */}
      {errorMsg && (
        <div className="p-4 mb-4 rounded-xl border border-red-300 text-red-700 bg-red-50">{errorMsg}</div>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="animate-spin" size={18} /> กำลังเตรียมหัวข้อ...
        </div>
      )}

      {/* Items */}
      {!loading && items.length === 0 && (
        <div className="text-slate-500">
          ยังไม่มีหัวข้อในหมวดนี้
          <div className="text-xs mt-1">(debug: categoryKey = <code>{categoryKey}</code>)</div>
        </div>
      )}

      <ul className="space-y-4 pb-24">
        {visible.map((it, idx) => {
          const status = getStatus(it);
          const stateIcon =
            status === "green" ? (
              <CheckCircle2 className="text-emerald-600" size={18} />
            ) : status === "yellow" ? (
              <AlertTriangle className="text-amber-600" size={18} />
            ) : (
              <Circle className="text-slate-400" size={18} />
            );

          const displayName = getDisplayName(it.name, idx);

          return (
            <li
              key={it.template_id}
              className={`bg-white p-4 rounded-xl shadow border ${
                status === "green" ? "border-emerald-200" : status === "yellow" ? "border-amber-200" : "border-slate-200"
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {stateIcon}
                  <div>
                    <div className="font-semibold text-slate-800">{displayName}</div>
                    <div className="text-xs text-slate-500">
                      คะแนนข้อนี้: +{it.score_points} • อัปเดตล่าสุด: {fmtDate(it.updated_at)}
                    </div>

                    {/* ชื่อไฟล์ + ปุ่มดู/เปลี่ยน/ลบ */}
                    {it.has_evidence && it.file_path ? (
                      <div className="text-xs mt-1 flex items-center gap-3">
                        <span className="text-emerald-700">ไฟล์: {it.file_path}</span>

                        <button
                          type="button"
                          onClick={() => onViewEvidence(it)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-500 underline"
                          title="ดูไฟล์"
                        >
                          <Eye size={14} /> ดูไฟล์
                        </button>

                        <label
                          className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-600 underline cursor-pointer"
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
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-500 underline"
                          title="ลบไฟล์"
                        >
                          <Trash2 size={14} /> ลบไฟล์
                        </button>
                      </div>
                    ) : status === "yellow" ? (
                      <div className="text-xs text-amber-700 mt-1">
                        ติ๊กแล้วแต่ยังไม่มีหลักฐาน — อัปโหลดไฟล์เพื่อปลดล็อกคะแนนเต็ม
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* actions */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm select-none">
                    <input
                      type="checkbox"
                      checked={!!it.has_record}
                      onChange={(e) => onToggleItem(it, e.target.checked)}
                      disabled={savingId === it.template_id}
                    />
                    ติ๊กแล้ว
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer">
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

              {/* textarea */}
              <div className="mt-3">
                <textarea
                  className="w-full border rounded-lg p-3 text-sm"
                  rows={3}
                  placeholder="พิมพ์บันทึก/สรุปหลักฐาน…"
                  value={drafts[it.template_id] ?? it.input_text ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [it.template_id]: e.target.value }))}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => onSaveText(it)}
                    disabled={savingId === it.template_id}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-500"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
