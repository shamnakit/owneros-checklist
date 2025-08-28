// src/components/checklist/ChecklistGroupPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Loader2, Upload, CheckCircle2, AlertTriangle, Circle } from "lucide-react";

/** หมวดมาตรฐานที่ใช้กับตาราง checklist_templates.category */
export type CategoryKey = "strategy" | "structure" | "sop" | "hr" | "finance" | "sales";

export type ChecklistGroupPageProps = {
  groupNo: 1 | 2 | 3 | 4 | 5 | 6;
  categoryKey: CategoryKey;
  title: string;               // เช่น "Checklist หมวด 2: โครงสร้างองค์กร"
  breadcrumb?: string;         // เช่น "Checklist › หมวด 2"
  requireEvidence?: boolean;   // default=false (MVP: ติ๊กก็นับ) ; ถ้า true จะนับเฉพาะมีไฟล์
  storageBucket?: string;      // default="evidence"
};

type Item = {
  template_id: string;
  name: string;
  score_points: number;
  has_record: boolean;
  has_evidence: boolean;
  updated_at: string | null;
  input_text: string | null;
  file_key: string | null;
  file_path: string | null;
};

type FilterKey = "all" | "not_started" | "checked_no_file" | "completed";

/** ------------------------------
 *  Override เฉพาะหมวด 1 (กลยุทธ์)
 *  หากต้องการแก้หัวข้อ ให้แก้ที่ STRATEGY_TITLES อย่างเดียว
 *  ลำดับจะแม็พตาม index ของรายการที่ดึงมา
 *  ------------------------------ */
const STRATEGY_TITLES: string[] = [
  "Vision (วิสัยทัศน์)",
  "Mission (พันธกิจ)",
  "Core Values (ค่านิยมหลัก)",
  "Strategic Objectives (วัตถุประสงค์เชิงกลยุทธ์)",
  "SWOT / TOWS (การวิเคราะห์จุดแข็ง–จุดอ่อน–โอกาส–อุปสรรค)",
  "Key Stakeholders & Needs (ผู้มีส่วนได้ส่วนเสียและความคาดหวัง)",
  "Critical Success Factors – CSF (ปัจจัยสู่ความสำเร็จ)",
  "Strategic Initiatives / Projects (โครงการเชิงกลยุทธ์)",
  "KPI Alignment (Lead–Lag) & Targets",
];

function fmtDate(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

const DEFAULT_BUCKET = "evidence";

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
  const { uid } = useUserProfile();
  const thisYear = new Date().getFullYear();

  const [years, setYears] = useState<number[]>([thisYear]);
  const [year, setYear] = useState<number>(thisYear);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  // draft ต่อข้อ (สำหรับ textarea)
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  /** โหลด “ปีที่มีข้อมูลจริง” ของ user */
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.rpc("fn_available_years_for_me");
      if (!mounted) return;
      if (!error && Array.isArray(data) && data.length) {
        const ys = data.map((r: any) => Number(r.year_version)).filter(Boolean);
        if (ys.length) {
          setYears(ys);
          setYear((y) => (ys.includes(y) ? y : ys[0]));
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  /** โหลดรายการ checklist ของหมวด */
  const load = async () => {
    if (!uid) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.rpc("fn_checklist_items_for_me", {
        p_year: year,
        p_category: categoryKey,
      });
      if (error) throw error;
      const rows = (data || []) as Item[];
      setItems(rows);
      // sync drafts จาก input_text ปัจจุบัน (ครั้งแรก/ตอนเปลี่ยนปี)
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
    if (!uid) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, year, categoryKey]);

  /** คำนวณสรุปหมวด (ถ่วงน้ำหนักคะแนน) */
  const summary = useMemo(() => {
    const total = items.reduce((s, it) => s + Number(it.score_points || 0), 0);
    const scored = items
      .filter((it) => (requireEvidence ? it.has_record && it.has_evidence : it.has_record))
      .reduce((s, it) => s + Number(it.score_points || 0), 0);
    const pct = total > 0 ? Math.round((scored / total) * 100) : 0;
    const counts = {
      completed: items.filter((it) => it.has_record && it.has_evidence).length,
      checkedNoFile: items.filter((it) => it.has_record && !it.has_evidence).length,
      notStarted: items.filter((it) => !it.has_record).length,
      withFile: items.filter((it) => it.has_evidence).length,
    };
    return { pct, total, scored, ...counts };
  }, [items, requireEvidence]);

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
  const toggleItem = async (it: Item, next: boolean) => {
    if (!uid) return;
    setSavingId(it.template_id);
    try {
      if (next) {
        const { error } = await supabase
          .from("checklists_v2")
          .upsert(
            [
              {
                user_id: uid,
                template_id: it.template_id,
                year_version: year,
                name: it.name,
                updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: "user_id,template_id,year_version" }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("checklists_v2")
          .delete()
          .eq("user_id", uid)
          .eq("template_id", it.template_id)
          .eq("year_version", year);
        if (error) throw error;
      }
      await load();
    } catch (e: any) {
      console.error(e);
      alert("บันทึกไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setSavingId(null);
    }
  };

  /** อัปโหลดหลักฐาน (ไฟล์) */
  const uploadEvidence = async (it: Item, file: File) => {
    if (!uid) return;
    setSavingId(it.template_id);
    try {
      // ensure row
      if (!it.has_record) {
        const { error } = await supabase
          .from("checklists_v2")
          .upsert(
            [
              {
                user_id: uid,
                template_id: it.template_id,
                year_version: year,
                name: it.name,
                updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: "user_id,template_id,year_version" }
          );
        if (error) throw error;
      }

      // upload to storage bucket
      const ext = file.name.split(".").pop() || "bin";
      const key = `${uid}/${year}/${it.template_id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(storageBucket).upload(key, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;

      // update row with file info
      const { error: updErr } = await supabase
        .from("checklists_v2")
        .update({
          file_key: key,
          file_path: file.name,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", uid)
        .eq("template_id", it.template_id)
        .eq("year_version", year);
      if (updErr) throw updErr;

      await load();
    } catch (e: any) {
      console.error(e);
      alert("อัปโหลดไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setSavingId(null);
    }
  };

  /** บันทึกข้อความ (textarea) */
  const saveText = async (it: Item) => {
    if (!uid) return;
    setSavingId(it.template_id);
    try {
      // ensure row
      if (!it.has_record) {
        const { error } = await supabase
          .from("checklists_v2")
          .upsert(
            [
              {
                user_id: uid,
                template_id: it.template_id,
                year_version: year,
                name: it.name,
                updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: "user_id,template_id,year_version" }
          );
        if (error) throw error;
      }

      const { error: updErr } = await supabase
        .from("checklists_v2")
        .update({
          input_text: drafts[it.template_id] ?? it.input_text ?? "",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", uid)
        .eq("template_id", it.template_id)
        .eq("year_version", year);
      if (updErr) throw updErr;

      await load();
    } catch (e: any) {
      console.error(e);
      alert("บันทึกไม่สำเร็จ: " + (e?.message || "unknown"));
    } finally {
      setSavingId(null);
    }
  };

  /** helper: แสดงชื่อหัวข้อ (รองรับ override เฉพาะ strategy) */
  const getDisplayName = (origName: string, index: number) => {
    if (categoryKey === "strategy") {
      return STRATEGY_TITLES[index] ?? origName;
    }
    return origName;
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
            ความคืบหน้าหมวดนี้: {summary.pct}%{" "}
            {requireEvidence ? "(นับเมื่อมีหลักฐาน)" : "(ติ๊กก็นับ)"}
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
            style={{
              width: `${summary.pct}%`,
              background: "linear-gradient(90deg,#60a5fa,#34d399)",
            }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          ครบพร้อมไฟล์: {summary.withFile} รายการ
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <button className={badge("ทั้งหมด", filter === "all")} onClick={() => setFilter("all")}>
          ทั้งหมด
        </button>
        <button
          className={badge("ยังไม่ทำ", filter === "not_started")}
          onClick={() => setFilter("not_started")}
        >
          ยังไม่ทำ
        </button>
        <button
          className={badge("ติ๊กแล้วไม่มีไฟล์", filter === "checked_no_file")}
          onClick={() => setFilter("checked_no_file")}
        >
          ติ๊กแล้วไม่มีไฟล์
        </button>
        <button
          className={badge("ทำแล้วมีไฟล์", filter === "completed")}
          onClick={() => setFilter("completed")}
        >
          ทำแล้วมีไฟล์
        </button>
      </div>

      {/* Error / Loading */}
      {errorMsg && (
        <div className="p-4 mb-4 rounded-xl border border-red-300 text-red-700 bg-red-50">
          {errorMsg}
        </div>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="animate-spin" size={18} /> กำลังเตรียมหัวข้อ...
        </div>
      )}

      {/* Items */}
      {!loading && visible.length === 0 && (
        <div className="text-slate-500">ยังไม่มีหัวข้อในหมวดนี้</div>
      )}

      <ul className="space-y-4 pb-24">
        {visible.map((it, idx) => {
          const stateIcon = it.has_record
            ? it.has_evidence
              ? <CheckCircle2 className="text-emerald-600" size={18} />
              : <AlertTriangle className="text-amber-600" size={18} />
            : <Circle className="text-slate-400" size={18} />;

          const displayName = getDisplayName(it.name, idx);

          return (
            <li
              key={it.template_id}
              className={`bg-white p-4 rounded-xl shadow border ${
                it.has_record
                  ? it.has_evidence
                    ? "border-emerald-200"
                    : "border-amber-200"
                  : "border-slate-200"
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
                    {it.has_record && !it.has_evidence && (
                      <div className="text-xs text-amber-700 mt-1">
                        ติ๊กแล้วแต่ยังไม่มีหลักฐาน — อัปโหลดไฟล์เพื่อปลดล็อกคะแนนเต็ม
                      </div>
                    )}
                    {it.has_evidence && it.file_path && (
                      <div className="text-xs text-emerald-700 mt-1">ไฟล์: {it.file_path}</div>
                    )}
                  </div>
                </div>

                {/* actions */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm select-none">
                    <input
                      type="checkbox"
                      checked={!!it.has_record}
                      onChange={(e) => toggleItem(it, e.target.checked)}
                      disabled={savingId === it.template_id}
                    />
                    ติ๊กแล้ว
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer">
                    <Upload size={16} />
                    <span>แนบไฟล์</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadEvidence(it, f);
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
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [it.template_id]: e.target.value }))
                  }
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => saveText(it)}
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
