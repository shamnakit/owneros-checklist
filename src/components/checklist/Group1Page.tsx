import React from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout"; // ✅ เพิ่ม

export default function Group1Page() {
  return (
    <MainLayout>
      <div className="relative min-h-screen bg-slate-50 p-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">1. กลยุทธ์องค์กร</h1>
        <p className="text-slate-600 mb-6">
          รวมเอกสารพื้นฐานที่เจ้าของกิจการต้องมี เช่น Vision, Mission, Core Value, BMC, SWOT, OKR
        </p>

        {/* ตัวอย่าง Checklist */}
        <ul className="space-y-4 pb-20">
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ มีการกำหนด Vision และ Mission อย่างชัดเจน</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ สร้าง Business Model Canvas (BMC)</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ ทำ SWOT วิเคราะห์จุดแข็ง/อ่อน</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ ตั้งเป้าหมายองค์กรแบบ OKR</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
        </ul>

        {/* ปุ่มกลับด้านล่างขวา */}
        <div className="absolute bottom-6 right-6">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-300 text-slate-800 rounded hover:bg-slate-400"
          >
            ← กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
