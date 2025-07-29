// ChecklistDashboard.tsx (แสดงโปรไฟล์ผู้ใช้ + อัปโหลดโลโก้บริษัท)

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  const [userInfo, setUserInfo] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserInfo(user);

      if (user) {
        // ดึง avatar URL จาก storage
        const { data } = await supabase.storage.from("avatars").getPublicUrl(`${user.id}/avatar.png`);
        setAvatarUrl(data?.publicUrl || null);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file || !userInfo?.id) return;

      const filePath = `${userInfo.id}/avatar.png`;

      await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true,
      });

      const { data } = await supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data?.publicUrl || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white p-6 flex flex-col justify-between">
        <div>
          {/* Profile */}
          <div className="mb-6 text-sm text-slate-300">
            {userInfo && (
              <div className="flex flex-col items-start gap-3">
                <div className="flex items-center gap-2">
                  {avatarUrl ? (
                    <img src={avatarUrl} className="w-10 h-10 rounded-full" alt="avatar" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">👤</div>
                  )}
                  <div>
                    <p className="text-white font-medium">{userInfo.user_metadata.full_name || userInfo.email}</p>
                    <p className="text-xs text-slate-400">{userInfo.email}</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="text-xs"
                />
              </div>
            )}
          </div>

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
        </div>

        {/* Footer: Logout */}
        <div className="text-sm text-slate-300 space-y-2 mt-6">
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-200 underline"
          >
            ออกจากระบบ
          </button>
        </div>
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