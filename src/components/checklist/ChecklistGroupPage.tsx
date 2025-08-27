// src/components/checklist/ChecklistGroupPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, CheckCircle2, AlertTriangle, Circle } from "lucide-react";

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

export type ChecklistGroupPageProps = {
  groupNo: 1|2|3|4|5|6;
  categoryKey: "strategy" | "structure" | "sop" | "hr" | "finance" | "sales";
  title: string;                 // เช่น "Checklist หมวด 2: โครงสร้างองค์กร"
  breadcrumb?: string;           // เช่น "Checklist › หมวด 2: โครงสร้างองค์กร"
  requireEvidence?: boolean;     // default = false (MVP: ติ๊กก็นับ)
  storageBucket?: string;        // default = "evidence"
};

function ChecklistGroupPageImpl({
  groupNo,
  categoryKey,
  title,
  breadcrumb,
  requireEvidence = false,
  storageBucket = "evidence",
}: ChecklistGroupPageProps) {
  const { uid } = useUserProfile();
  const thisYear = new Date().getFullYear();

  const [years, setYears] = useState<number[]>([thisYear]);
  const [year, setYear] = useState<number>(thisYear);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // โหลดปีที่มีจริง
  useEffect(() => {
    if (!uid) return;
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.rpc("fn_available_years_for_me");
      if (!mounted) return;
      if (!error && data?.length) {
        const ys = data.map((r: any) => Number(r.year_version)).filter(Boolean);
        setYears(ys);
        setYear((y) => (ys.includes(y) ? y : ys[0]));
      }
    })();
    return () => { mounted = false; };
  }, [uid]);

  // โหลดรายการตามหมวด
  const load = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.rpc("fn_checklist_items_for_me", {
        p_year: year,
        p_category: categoryKey,
      });
      if (error) throw error;
      setItems((data || []) as Item[]);
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

  // Summary (MVP: ติ๊กก็นับคะแนน ถ้า requireEvidence=true จะนับเฉพาะมีไฟล์)
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
    };
    return { pct, total, scored, ...counts };
  }, [items, requireEvidence]);

  // ฟิลเตอร์
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

  // ติ๊ก/ยกเลิก
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

  // อัปโหลดไฟล์หลักฐาน
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

      // upload to storage
      const ext = file.name.split(".").pop() || "bin";
      const key = `${uid}/${year}/${it.template_id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(storageBucket).upload(key, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;

      // update record
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

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-slate-500">{breadcrumb || `Checklist › หมวด ${groupNo}`}</div>
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">ปี:</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded-md px-2 py-1">
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <Card className="p-4 mb-6">
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
          <div className="h-2 rounded-full" style={{ width: `${summary.pct}%`, background: "linear-gradient(90deg,#60a5fa,#34d399)" }} />
        </div>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {[
          { k: "all", label: "ทั้งหมด" },
          { k: "not_started", label: "ยังไม่ทำ" },
          { k: "checked_no_file", label: "ติ๊กแล้วไม่มีไฟล์" },
          { k: "completed", label: "ทำแล้วมีไฟล์" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k as FilterKey)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              filter === f.k ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error / Loading */}
      {errorMsg && <Card className="p-4 mb-4 border-red-300 text-red-700">{errorMsg}</Card>}
      {loading && (
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="animate-spin" size={18} /> กำลังเตรียมหัวข้อ...
        </div>
      )}

      {/* Items */}
      {!loading && items.length === 0 && <div className="text-slate-500">ยังไม่มีหัวข้อในหมวดนี้</div>}

      <ul className="space-y-4 pb-24">
        {visible.map((it) => {
          const stateIcon = it.has_record
            ? it.has_evidence
              ? <CheckCircle2 className="text-emerald-600" size={18} />
              : <AlertTriangle className="text-amber-600" size={18} />
            : <Circle className="text-slate-400" size={18} />;

          return (
            <li
              key={it.template_id}
              className={`bg-white p-4 rounded-xl shadow border ${
                it.has_record ? (it.has_evidence ? "border-emerald-200" : "border-amber-200") : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {stateIcon}
                  <div>
                    <div className="font-semibold text-slate-800">{it.name}</div>
                    <div className="text-xs text-slate-500">
                      คะแนนข้อนี้: +{it.score_points} • อัปเดตล่าสุด: {it.updated_at ? new Date(it.updated_at).toLocaleString() : "-"}
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

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
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
            </li>
          );
        })}
      </ul>

      <div className="fixed bottom-6 right-6 flex gap-2">
        <Link href="/checklist">
          <Button className="bg-slate-300 text-slate-800 hover:bg-slate-400">← กลับหน้ารวม</Button>
        </Link>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(ChecklistGroupPageImpl), { ssr: false });
