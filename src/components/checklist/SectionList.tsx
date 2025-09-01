// src/components/checklist/SectionList.tsx
import React from "react";
import type { ChecklistItem } from "@/services/checklistService";
import ItemCard from "./ItemCard";

type Props = {
  items: ChecklistItem[];
  onSaveItem: (partial: Partial<ChecklistItem>) => Promise<void> | void;
  onUpload: (file: File, templateId: string) => Promise<void> | void;
};

export default function SectionList({ items, onSaveItem, onUpload }: Props) {
  if (!items?.length) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-gray-500">
        ยังไม่มีรายการ
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((it) => (
        <ItemCard
          key={it.template_id}
          item={it}
          onSave={onSaveItem}
          onUpload={onUpload}
        />
      ))}
    </div>
  );
}
