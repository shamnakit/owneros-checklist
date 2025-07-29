"use client"; // เผื่อใช้ใน App Router แต่ถ้าใช้ Pages Router ข้ามได้

import dynamic from "next/dynamic";
import { useUserProfile } from "../contexts/UserProfileContext";
import { supabase } from "../utils/supabaseClient";
import Image from "next/image";
import Link from "next/link";

// ✅ ป้องกัน SSR: ไม่ให้ render component นี้บน server
if (typeof window === "undefined") {
  // สำคัญ: ไม่โหลด component นี้บน server
  // ทำให้ Next.js ไม่พังตอน prerender
  // หรือ export default () => null ก็ได้
  throw new Error("Sidebar should not render on server");
}

export default function Sidebar() {
  const context = useUserProfile();

  if (!context || context.loading || !context.profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white w-64">
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const { profile } = context;

  return (
    <div className="flex flex-col justify-between h-screen p-4 bg-gray-900 text-white w-64">
      <div>
        {/* Avatar */}
        <div className="flex justify-center mt-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
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
        </div>

        {/* Full Name */}
        <div className="text-center mt-2 text-lg font-semibold">
          {profile.full_name || "ชื่อผู้ใช้"}
        </div>

        {/* Edit Profile */}
        <div className="text-center mb-4">
          <Link href="/checklist/profile" className="text-blue-400 text-xs hover:underline">
            แก้ไขโปรไฟล์
          </Link>
        </div>

        {/* Company Logo & Name */}
        <div className="text-center mb-4">
          {profile.company_logo_url && (
            <div className="flex justify-center mb-2">
              <Image
                src={profile.company_logo_url}
                alt="Company Logo"
                width={100}
                height={100}
                className="rounded"
              />
            </div>
          )}
          <div className="text-sm">
            {profile.company_name || "ชื่อบริษัท"}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          <ul className="space-y-2">
            <li>
              <Link href="/checklist" className="hover:underline block">
                ✔ Checklist
              </Link>
            </li>
            <li>
              <Link href="/checklist/summary" className="hover:underline block">
                📊 Summary
              </Link>
            </li>
            <li>
              <Link href="/checklist/settings" className="hover:underline block">
                ⚙ Settings
              </Link>
            </li>
            <li>
              <Link href="/checklist/change-password" className="hover:underline block text-yellow-400">
                🔐 เปลี่ยนรหัสผ่าน
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Logout */}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/checklist/login";
        }}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm mt-6"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
