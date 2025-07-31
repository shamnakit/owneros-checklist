import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/utils/supabaseClient";

export default function Sidebar() {
  const context = useUserProfile();

  if (!context || context.loading || !context.profile) {
    return (
      <div className="w-64 bg-slate-800 text-white flex items-center justify-center">
        <p>กำลังโหลด...</p>
      </div>
    );
  }

  const { profile } = context;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 bg-slate-800 text-white p-6 flex flex-col justify-between">
      <div>
        {/* Avatar + Profile */}
        <div className="flex flex-col items-center mb-6">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="User Avatar"
              width={72}
              height={72}
              className="rounded-full border-2 border-white mb-2"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-gray-600 mb-2 flex items-center justify-center text-xl">
              👤
            </div>
          )}

          <div className="text-center">
            <div className="text-lg font-bold">{profile.company_name || "OwnerOS"}</div>
            <Link href="/profile" className="text-sm text-blue-300 hover:underline">
              แก้ไขโปรไฟล์
            </Link>
            <div className="text-sm mt-1">{profile.phone_number || ""}</div>
          </div>
        </div>

        {/* Company Logo */}
        {profile.company_logo_url && (
          <div className="flex justify-center mb-6">
            <Image
              src={profile.company_logo_url}
              alt="Company Logo"
              width={48}
              height={48}
              className="bg-white p-1 rounded"
            />
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-3">
          <Link href="/checklistPage">
            <div className="flex items-center space-x-2 hover:text-blue-400 cursor-pointer">
              <span>📋</span>
              <span>Checklist</span>
            </div>
          </Link>
          <Link href="/summary">
            <div className="flex items-center space-x-2 hover:text-blue-400 cursor-pointer">
              <span>📊</span>
              <span>Summary</span>
            </div>
          </Link>
          <Link href="/settings">
            <div className="flex items-center space-x-2 hover:text-blue-400 cursor-pointer">
              <span>⚙️</span>
              <span>Settings</span>
            </div>
          </Link>
        </nav>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full text-sm mt-6 bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700"
      >
        ออกจากระบบ
      </button>
    </aside>
  );
}
