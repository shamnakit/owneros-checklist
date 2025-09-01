// ================================================
// File: src/components/checklist/StatusBadge.tsx
// ================================================
import React from "react";


type Props = { state: "done" | "missing-evidence" | "todo" };


export default function StatusBadge({ state }: Props) {
if (state === "done")
return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">ติ๊กแล้ว</span>;
if (state === "missing-evidence")
return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">ขาดหลักฐาน</span>;
return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">ยังไม่ทำ</span>;
}