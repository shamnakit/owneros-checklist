//src/pages/exports/index.tsx

import { FileDown, FileText, Shield } from "lucide-react";

export default function UserExportsPage() {
  const templates = [
    { id: "owner_v1", name: "Owner Binder v1", desc: "รวมภาพรวมธุรกิจ + SOP + Evidence สำคัญ" },
    { id: "dd_lite", name: "Due Diligence Lite", desc: "แพ็กให้ VC/ที่ปรึกษาตรวจเร็ว" },
    { id: "bank_pack", name: "Bank Loan Pack", desc: "ชุดเอกสารยื่นสินเชื่อ" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ดาวน์โหลดรายงาน</h1>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 text-neutral-300">
        <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4" /> ข้อมูลจะมีลายน้ำและบันทึกประวัติการดาวน์โหลด</div>
        <div className="text-sm text-neutral-400">ไฟล์จะเป็น PDF/DOCX (ตามเทมเพลต) พร้อมเลขเวอร์ชันและวันเวลาออกรายงาน</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="flex items-center gap-2 text-neutral-200">
              <FileText className="w-4 h-4" /> <b>{t.name}</b>
            </div>
            <p className="text-sm text-neutral-400 mt-1">{t.desc}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-lg bg-white text-black text-sm inline-flex items-center gap-2"
                onClick={() => alert(`queue export: ${t.id}`)}
              >
                <FileDown className="w-4 h-4" /> สร้างไฟล์
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-neutral-700 text-sm">ตัวอย่าง</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
