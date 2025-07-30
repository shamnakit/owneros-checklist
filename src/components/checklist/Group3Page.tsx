// src/components/checklist/Group3Page.tsx
import React from "react";
import Link from "next/link";

export default function Group3Page() {
  return (
    <div className="relative min-h-screen bg-slate-50 p-10">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">3. คู่มือปฏิบัติงาน</h1>
      <p className="text-slate-600 mb-6">
        เอกสารขั้นตอนการทำงานภายในองค์กร เช่น SOP, Work Instruction (WI), Flowchart
      </p>

      <ul className="space-y-4 pb-20">
        <li className="bg-white p-4 rounded shadow flex justify-between items-center">
          <span>✅ มี SOP (Standard Operating Procedure) สำหรับงานหลัก</span>
          <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
        </li>
        <li className="bg-white p-4 rounded shadow flex justify-between items-center">
          <span>✅ มี Work Instruction (WI) สำหรับตำแหน่งเฉพาะ</span>
          <button className="text-sm text-blue-600 underline">แนบไฟล์</button>
        </li>
        <li className="bg-white p-4 rounded shadow flex justify-between items-center">
          <span>✅ มี Flowchart แสดงขั้นตอนงาน</span>
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
  );
}
