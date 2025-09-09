// src/components/checklist/ItemCard.tsx
'use client';
import React, { useEffect, useState } from "react";
import type { ChecklistItem } from "@/services/checklistService";
import { getStatus } from "@/services/checklistService";

type Props = {
  item: ChecklistItem;
  onSave?: (partial: Partial<ChecklistItem>) => Promise<void> | void;
  onUpload?: (file: File, itemTemplateId: string) => Promise<void> | void;
};

/** Map เป็นสถานะภารกิจ (Moonship) */
type MissionStatus = "GO" | "HOLD" | "NO-GO";
const toMissionStatus = (it: Pick<ChecklistItem, "has_record" | "has_evidence">): MissionStatus => {
  if (it.has_record && it.has_evidence) return "GO";
  if (it.has_record && !it.has_evidence) return "HOLD";
  return "NO-GO";
};

function StatusBadge({ item }: { item: ChecklistItem }) {
  const ms = toMissionStatus(item);
  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium";
  if (ms === "GO")
    return (
      <span className={`${base} text-emerald-300 border-emerald-400/40 bg-emerald-500/10`}>
        ● GO
      </span>
    );
  if (ms === "HOLD")
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

export default function ItemCard({ item, onSave, onUpload }: Props) {
  const [text, setText] = useState<string>(item.input_text ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(item.input_text ?? "");
  }, [item.template_id, item.input_text]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload?.(file, item.template_id);
    // clear input value so the same file can be selected again
    e.currentTarget.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.({ template_id: item.template_id, input_text: text.trim() });
    } finally {
      setSaving(false);
    }
  };

  // legacy status icon color (ใช้กับเส้นขอบการ์ด)
  const legacy = getStatus({ has_record: item.has_record, has_evidence: item.has_evidence });
  const borderColor =
    legacy === "green"
      ? "rgba(16,185,129,0.35)"
      : legacy === "yellow"
      ? "rgba(245,158,11,0.35)"
      : "rgba(255,255,255,0.12)";

  return (
    <div
      className="rounded-xl p-4 shadow-sm border"
      style={{ borderColor, background: "rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-100/95">{item.name}</div>
          <div className="mt-1 text-xs text-slate-300">
            คะแนนข้อนี้: +{Number(item.score_points || 0).toLocaleString()}
          </div>
        </div>
        <StatusBadge item={item} />
      </div>

      <div className="mt-3">
        <div
          className="rounded-lg border border-white/10 bg-white/5"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
        >
          <textarea
            className="w-full bg-transparent p-3 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
            placeholder="บันทึก/สรุปหลักฐาน… (เพิ่ม Δv ให้ยานของคุณ)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:bg-white/10">
          แนบไฟล์
          <input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
            onChange={handleUpload}
          />
        </label>

        {item.file_path && (
          <span className="text-sm text-emerald-300/90">ไฟล์: {item.file_path}</span>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto rounded-lg bg-yellow-400/90 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-70"
          style={{ boxShadow: "0 0 18px rgba(255,213,74,0.25)" }}
        >
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
