// pages/checklist/Group4Page.tsx
import React from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout"; // ✅ เพิ่ม Layout

export default function Group4Page() {
  return (
    <MainLayout>
      <div className="relative min-h-screen bg-slate-50 p-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">4. ระบบบุคคล & HR</h1>
        <p className="text-slate-600 mb-6">
          รวมเอกสารเกี่ยวกับการบริหารบุคลากร เช่น ฟอร์มรับคน, Onboarding, การประเมินผล
        </p>

        <ul className="space-y-4 pb-20">
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ มีแบบฟอร์มรับสมัครงานหรือ JD ตำแหน่งต่าง ๆ</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ มีระบบ Onboarding สำหรับพนักงานใหม่</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ มีแบบฟอร์มประเมินผลรายไตรมาส / ปี</span>
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
    </MainLayout>
  );
}
