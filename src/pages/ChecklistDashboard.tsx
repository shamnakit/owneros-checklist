import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/router";

const sections = [
  { id: 1, title: "กลยุทธ์องค์กร", path: "/checklist/group1" },
  { id: 2, title: "โครงสร้างองค์กร", path: "/checklist/group2" },
  { id: 3, title: "คู่มือปฏิบัติงาน", path: "/checklist/group3" },
  { id: 4, title: "ระบบบุคคล & HR", path: "/checklist/group4" },
  { id: 5, title: "ระบบการเงิน", path: "/checklist/group5" },
  { id: 6, title: "ระบบลูกค้า / ขาย", path: "/checklist/group6" },
];

export default function ChecklistDashboard() {
  const [userEmail, setUserEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (profile) {
          setFullName(profile.full_name || "");
          setAvatarUrl(profile.avatar_url || "");
        }
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white p-6 flex flex-col justify-between">
        <div>
          {/* User profile section */}
          <div className="mb-6 cursor-pointer" onClick={() => setShowProfilePopup(true)}>
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                  👤
                </div>
              )}
              <div className="text-sm">
                <div className="font-medium">{fullName || "ไม่ระบุชื่อ"}</div>
                <div className="text-slate-400 text-xs">{userEmail}</div>
              </div>
            </div>
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

        <button
          onClick={handleLogout}
          className="text-red-400 hover:text-red-200 text-sm mt-10"
        >
          🔒 ออกจากระบบ
        </button>
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

      {/* Profile Popup */}
      {showProfilePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[320px] shadow-lg relative">
            <button
              onClick={() => setShowProfilePopup(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✖️
            </button>
            <h3 className="text-lg font-semibold mb-4">โปรไฟล์ผู้ใช้งาน</h3>
            <div className="flex flex-col items-center space-y-4">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border"
                />
              )}
              <div className="text-center">
                <div className="font-medium">{fullName || "ไม่ระบุชื่อ"}</div>
                <div className="text-sm text-gray-500">{userEmail}</div>
              </div>
              <button
                className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded hover:bg-blue-700"
                onClick={() => alert("Coming soon: Edit profile")}
              >
                แก้ไขโปรไฟล์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
