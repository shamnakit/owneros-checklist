import React from "react";
import Link from "next/link";
import MainLayout from "@/layouts/MainLayout"; // ✅ เพิ่ม MainLayout

export default function Group5Page() {
  return (
    <MainLayout>
      <div className="relative min-h-screen bg-slate-50 p-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">5. ระบบการเงิน</h1>
        <p className="text-slate-600 mb-6">
          รวมเอกสารด้านการบริหารเงิน เช่น งบประมาณ, Cash Flow, ระบบควบคุมต้นทุน
        </p>

        <ul className="space-y-4 pb-20">
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ มีงบประมาณประจำปีที่กำหนดไว้ล่วงหน้า</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ มีการคาดการณ์กระแสเงินสด (Cash Flow Forecast)</span>
            <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
          </li>
          <li className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>✅ มีระบบควบคุมต้นทุนหรือรายจ่าย</span>
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
