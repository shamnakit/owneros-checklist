import React from "react";

const sections = [
  { id: 1, title: "กลยุทธ์องค์กร" },
  { id: 2, title: "โครงสร้างองค์กร" },
  { id: 3, title: "คู่มือปฏิบัติงาน" },
  { id: 4, title: "ระบบบุคคล & HR" },
  { id: 5, title: "ระบบการเงิน" },
  { id: 6, title: "ระบบลูกค้า / ขาย" },
];

export default function ChecklistDashboard() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white p-6 space-y-4">
        <h1 className="text-2xl font-bold mb-6">OwnerOS</h1>
        <nav className="space-y-3">
          <a href="#" className="flex items-center space-x-2 hover:text-blue-400">
            <span>📋</span>
            <span>Checklist</span>
          </a>
          <a href="#" className="flex items-center space-x-2 hover:text-blue-400">
            <span>📊</span>
            <span>Summary</span>
          </a>
          <a href="#" className="flex items-center space-x-2 hover:text-blue-400">
            <span>⚙️</span>
            <span>Settings</span>
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-slate-50 p-10">
        <h2 className="text-2xl font-bold text-slate-800">Checklist ระบบองค์กร</h2>
        <p className="text-slate-500 mt-1 mb-6">เอกสารสำคัญในการวางระบบบริษัท</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div key={section.id} className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold text-lg mb-2">
                {section.id}. {section.title}
              </h3>
              <p className="text-sm text-slate-500 mb-4">Progress: 0%</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                เข้าดู Checklist
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
