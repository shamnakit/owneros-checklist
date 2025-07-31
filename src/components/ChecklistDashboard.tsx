import React from "react";
import Link from "next/link";

const sections = [
  { id: 1, title: "กลยุทธ์องค์กร", path: "/checklist/group1" },
  { id: 2, title: "โครงสร้างองค์กร", path: "/checklist/group2" },
  { id: 3, title: "คู่มือปฏิบัติงาน", path: "/checklist/group3" },
  { id: 4, title: "ระบบบุคคล & HR", path: "/checklist/group4" },
  { id: 5, title: "ระบบการเงิน", path: "/checklist/group5" },
  { id: 6, title: "ระบบลูกค้า / ขาย", path: "/checklist/group6" },
];

export default function ChecklistDashboard() {
  return (
    <main className="flex-1 bg-slate-50 p-10">
      <h2 className="text-2xl font-bold text-slate-800">Checklist ระบบองค์กร</h2>
      <p className="text-slate-500 mt-1 mb-6">
        เอกสารสำคัญในการวางระบบบริษัท
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold text-lg mb-2">
              {section.id}. {section.title}
            </h3>
            <p className="text-sm text-slate-500 mb-4">Progress: 0%</p>
            <Link href={section.path}>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                เข้าดู Checklist
              </button>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
