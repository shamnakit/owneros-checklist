import React from "react";
import Link from "next/link";

export default function Group6Page() {
  return (
    <div className="relative min-h-screen bg-slate-50 p-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">6. ระบบลูกค้า / ขาย</h1>
      <p className="text-slate-600 mb-6">
        รวมเอกสารเกี่ยวกับการบริหารลูกค้า เช่น Customer Journey, CRM, การเก็บ Feedback
      </p>

      <ul className="space-y-4 pb-20">
        <li className="bg-white p-4 rounded shadow flex justify-between items-center">
          <span>✅ มีการกำหนด Customer Journey ของลูกค้าเป้าหมาย</span>
          <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
        </li>
        <li className="bg-white p-4 rounded shadow flex justify-between items-center">
          <span>✅ มีระบบ CRM ติดตามลูกค้า/ดีล</span>
          <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
        </li>
        <li className="bg-white p-4 rounded shadow flex justify-between items-center">
          <span>✅ มีระบบ Feedback จากลูกค้า / แบบสอบถาม</span>
          <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
        </li>
      </ul>

      {/* ปุ่มกลับหน้าหลัก */}
      <div className="absolute bottom-6 right-6">
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-slate-300 text-slate-800 rounded hover:bg-slate-400"
        >
          ← กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
