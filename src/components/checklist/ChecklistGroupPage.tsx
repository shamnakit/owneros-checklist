// src/components/checklist/ChecklistGroupPage.tsx
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
import { Loader2, Upload, CheckCircle2, AlertTriangle, Circle, Eye, Trash2 } from "lucide-react";

const toMaturity = (it: ChecklistItem) => {
  if (!it.has_record) return 0;
  return it.has_evidence ? 2 : 1;
};

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

/** ---------- ชื่อ/คำอธิบาย override ต่อหมวด ---------- */
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

const badge = (active = false) =>
  `px-3 py-1.5 rounded-full text-sm ${active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`;

export default function ChecklistGroupPage({
  groupNo,
  categoryKey,
  title,
  breadcrumb,
  requireEvidence = false,
  storageBucket = DEFAULT_BUCKET,
}: ChecklistGroupPageProps) {
  const router = useRouter();
  // ✅ ดึงปีจาก query เท่านั้น (ไม่มี dropdown แล้ว)
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

  /** ติ๊ก/ยกเลิก */
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

  /** อัปโหลด/เปลี่ยน/ลบ/ดูไฟล์ */
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

  /** บันทึกข้อความ */
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

  /** helper: ชื่อหัวข้อ (รองรับ override + ลำดับ) */
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
    <main className="flex-1 bg-slate-50 p-6 md:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-slate-500">{breadcrumb || `Checklist › หมวด ${groupNo}`}</div>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">{title}</h1>
          <div className="mt-1 text-sm text-slate-500">ปี {year}</div>
        </div>

        {/* Summary cards */}
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500">ความครบถ้วน (นับเฉพาะมีไฟล์)</div>
            <div className="text-3xl font-bold text-emerald-600 text-right">{summary.pct}%</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500">คะแนน</div>
            <div className="text-right text-lg font-semibold">
              {summary.scored.toLocaleString()} / {summary.total.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500">เสร็จ + มีไฟล์</div>
          <div className="mt-1 text-xl font-bold">{summary.completed}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500">ติ๊กแต่ไม่มีไฟล์</div>
          <div className="mt-1 text-xl font-bold">{summary.checkedNoFile}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500">ยังไม่เริ่ม</div>
          <div className="mt-1 text-xl font-bold">{summary.notStarted}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="text-xs text-slate-500">มีไฟล์แล้ว</div>
          <div className="mt-1 text-xl font-bold">{summary.withFile}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <button className={badge(filter === "all")} onClick={() => setFilter("all")}>ทั้งหมด</button>
        <button className={badge(filter === "not_started")} onClick={() => setFilter("not_started")}>ยังไม่ทำ</button>
        <button className={badge(filter === "checked_no_file")} onClick={() => setFilter("checked_no_file")}>ติ๊กแล้วไม่มีไฟล์</button>
        <button className={badge(filter === "completed")} onClick={() => setFilter("completed")}>ทำแล้วมีไฟล์</button>
      </div>

      {/* Error / Loading */}
      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">{errorMsg}</div>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="animate-spin" size={18} /> กำลังเตรียมหัวข้อ...
        </div>
      )}

      {/* Items */}
      {!loading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          ยังไม่มีหัวข้อของปีนี้
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
              className={`bg-white p-4 rounded-xl shadow-sm border ${
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

                    {/* Maturity */}
                    <div className="mt-1 text-xs">
                      <span className="text-slate-600">ระดับ Maturity: </span>
                      {(() => {
                        const m = toMaturity(it);
                        return (
                          <span className={`font-medium ${m === 2 ? "text-emerald-700" : m === 1 ? "text-amber-700" : "text-slate-500"}`}>
                            {m === 2 ? "2 – ครบและใช้งานจริง" : m === 1 ? "1 – มีบางส่วน" : "0 – ยังไม่เริ่ม"}
                          </span>
                        );
                      })()}
                      <span className="ml-2 text-slate-400">(ติ๊ก = 1, ติ๊ก+ไฟล์ = 2)</span>
                    </div>

                    {/* ชื่อไฟล์ + ปุ่มดู/เปลี่ยน/ลบ */}
                    {it.has_evidence && it.file_path ? (
                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <span className="text-emerald-700">ไฟล์: {it.file_path}</span>

                        <button
                          type="button"
                          onClick={() => onViewEvidence(it)}
                          className="inline-flex items-center gap-1 underline text-blue-600 hover:text-blue-500"
                          title="ดูไฟล์"
                        >
                          <Eye size={14} /> ดูไฟล์
                        </button>

                        <label
                          className="inline-flex cursor-pointer items-center gap-1 underline text-slate-700 hover:text-slate-600"
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
                          className="inline-flex items-center gap-1 underline text-red-600 hover:text-red-500"
                          title="ลบไฟล์"
                        >
                          <Trash2 size={14} /> ลบไฟล์
                        </button>
                      </div>
                    ) : status === "yellow" ? (
                      <div className="mt-1 text-xs text-amber-700">
                        ติ๊กแล้วแต่ยังไม่มีหลักฐาน — อัปโหลดไฟล์เพื่อปลดล็อกคะแนนเต็ม
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* actions */}
                <div className="flex items-center gap-2">
                  <label className="flex select-none items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!it.has_record}
                      onChange={(e) => onToggleItem(it, e.target.checked)}
                      disabled={savingId === it.template_id}
                    />
                    ติ๊กแล้ว
                  </label>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">
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
                  className="w-full rounded-lg border p-3 text-sm"
                  rows={3}
                  placeholder="พิมพ์บันทึก/สรุปหลักฐาน…"
                  value={drafts[it.template_id] ?? it.input_text ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [it.template_id]: e.target.value }))}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => onSaveText(it)}
                    disabled={savingId === it.template_id}
                    className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500"
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
