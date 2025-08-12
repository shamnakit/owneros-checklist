// src/components/Sidebar.tsx
import { useUserProfile } from "@/contexts/UserProfileContext";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";

export default function Sidebar() {
  const { profile, loading } = useUserProfile();

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white w-64">
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // เลือกแหล่งภาพ: avatar_url > company_logo_url > ไม่มี (fallback)
  const avatarSrc = profile.avatar_url ?? profile.company_logo_url ?? null;

  return (
    <div className="flex flex-col justify-between h-screen p-4 bg-gray-900 text-white w-64">
      <div>
        {/* Avatar & Profile Info */}
        <div className="flex flex-col items-center mt-4 mb-6">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt="User Avatar"
              width={80}
              height={80}
              className="rounded-full border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
              👤
            </div>
          )}
          <div className="text-center mt-2">
            <div className="text-lg font-semibold">
              {profile.full_name || "ชื่อผู้ใช้"}
            </div>
            <div className="text-sm text-gray-400">
              {profile.position || "ตำแหน่ง"}
            </div>
            <div className="text-sm text-gray-300 mt-1">
              {profile.company_name || "ชื่อบริษัท"}
            </div>
            <Link
              href="/checklist/profile"
              className="text-blue-400 text-xs hover:underline block mt-1"
            >
              แก้ไขโปรไฟล์
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-3">
          <Link href="/dashboard" className="block">
            <div className="flex items-center space-x-2 hover:text-blue-400 cursor-pointer">
              <span>🏠</span>
              <span>Dashboard</span>
            </div>
          </Link>
          <Link href="/checklist" className="block">
            <div className="flex items-center space-x-2 hover:text-blue-400 cursor-pointer">
              <span>📋</span>
              <span>Checklist</span>
            </div>
          </Link>
          <Link href="/checklist/summary" className="block">
            <div className="flex items-center space-x-2 hover:text-blue-400 cursor-pointer">
              <span>📊</span>
              <span>Summary</span>
            </div>
          </Link>
          <Link href="/checklist/settings" className="block">
            <div className="flex items-center space-x-2 hover:text-blue-400 cursor-pointer">
              <span>⚙️</span>
              <span>Settings</span>
            </div>
          </Link>
        </nav>
      </div>

      {/* Logout */}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm mt-6"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
