import React from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout"; // ✅ เพิ่ม MainLayout

export default function Group2Page() {
  return (
    <MainLayout>
      <div className="relative min-h-screen bg-slate-50 p-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">2. โครงสร้างองค์กร</h1>
        <p className="text-slate-600 mb-6">
          รวมเอกสารที่เกี่ยวกับโครงสร้างทีมงาน หน้าที่ ความรับผิดชอบ และ KPI
        </p>

        <ul className="space-y-4 pb-20">
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ มีโครงสร้างองค์กร (Org Chart)</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ กำหนด JD (Job Description)</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ วัดผลพนักงานด้วย KPI</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
        </ul>

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
