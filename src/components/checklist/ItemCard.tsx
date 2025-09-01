// src/components/checklist/ItemCard.tsx
import React, { useState } from "react";
import type { ChecklistItem } from "@/services/checklistService";
import { getStatus } from "@/services/checklistService";

type Props = {
  item: ChecklistItem;
  onSave?: (partial: Partial<ChecklistItem>) => Promise<void> | void;
  onUpload?: (file: File, itemTemplateId: string) => Promise<void> | void;
};

function StatusBadge({ item }: { item: ChecklistItem }) {
  const state = getStatus({ has_record: item.has_record, has_evidence: item.has_evidence });
  if (state === "green")
    return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">ติ๊กแล้ว+มีไฟล์</span>;
  if (state === "yellow")
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">ติ๊กแล้ว (ยังไม่มีไฟล์)</span>;
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">ยังไม่ทำ</span>;
}

export default function ItemCard({ item, onSave, onUpload }: Props) {
  const [text, setText] = useState<string>(item.input_text ?? "");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload?.(file, item.template_id);
  };

  const handleSave = async () => {
    await onSave?.({ template_id: item.template_id, input_text: text.trim() });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="mt-1 text-xs text-slate-500">
            คะแนน: {Number(item.score_points || 0).toLocaleString()}
          </div>
        </div>
        <StatusBadge item={item} />
      </div>

      <div className="mt-3">
        <textarea
          className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="บันทึก/สรุปหลักฐาน..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
          แนบไฟล์
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>

        {item.file_path && (
          <span className="text-sm text-slate-600">ไฟล์: {item.file_path}</span>
        )}

        <button
          onClick={handleSave}
          className="ml-auto rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          บันทึก
        </button>
      </div>
    </div>
  );
}
