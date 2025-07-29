import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/utils/supabaseClient";

const sections = [
  { id: 1, title: "กลยุทธ์องค์กร", path: "/checklist/group1" },
  { id: 2, title: "โครงสร้างองค์กร", path: "/checklist/group2" },
  { id: 3, title: "คู่มือปฏิบัติงาน", path: "/checklist/group3" },
  { id: 4, title: "ระบบบุคคล & HR", path: "/checklist/group4" },
  { id: 5, title: "ระบบการเงิน", path: "/checklist/group5" },
  { id: 6, title: "ระบบลูกค้า / ขาย", path: "/checklist/group6" },
];

export default function ChecklistDashboard() {
  const { profile } = useUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white p-6 flex flex-col justify-between">
        <div>
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            {profile?.avatar_url && (
              <Image
                src={profile.avatar_url}
                alt="Avatar"
                width={64}
                height={64}
                className="rounded-full mb-2 border-2 border-white"
              />
            )}
            <div className="text-center">
              <div className="font-bold text-lg">
                {profile?.company_name || "OwnerOS"}
              </div>
              <Link href="/profile" className="text-sm text-blue-300 hover:underline">
                แก้ไขโปรไฟล์
              </Link>
            </div>
          </div>

          {/* Company Logo (if needed to remain) */}
          {profile?.company_logo_url && (
            <div className="flex justify-center mb-6">
              <Image
                src={profile.company_logo_url}
                alt="Company Logo"
                width={40}
                height={40}
                className="rounded bg-white p-1"
              />
            </div>
          )}

          {/* Menu */}
          <nav className="space-y-3">
            <Link href="/checklist">
              <div className="flex items-center space-x-2 hover:text-blue-400">
                <span>📋</span>
                <span>Checklist</span>
              </div>
            </Link>
            <Link href="/summary">
              <div className="flex items-center space-x-2 hover:text-blue-400">
                <span>📊</span>
                <span>Summary</span>
              </div>
            </Link>
            <Link href="/settings">
              <div className="flex items-center space-x-2 hover:text-blue-400">
                <span>⚙️</span>
                <span>Settings</span>
              </div>
            </Link>
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full text-sm mt-6 bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700"
        >
          ออกจากระบบ
        </button>
      </aside>

      {/* Main content */}
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
    </div>
  );
}
