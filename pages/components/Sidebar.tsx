import { useUserProfile } from "@/hooks/useUserProfile";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";


export default function Sidebar() {
  const { profile, loading } = useUserProfile();

  return (
    <div className="flex flex-col justify-between h-screen p-4 bg-gray-900 text-white w-64">
      <div>
        {/* Avatar */}
        <div className="flex justify-center mt-4">
          {profile?.avatar_url ? (
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

        {/* Company & User Info */}
        <div className="text-center mt-2">
          <div className="font-semibold text-lg">
            {profile?.company_name || "ชื่อบริษัท"}
          </div>
          <div className="text-sm">
            {profile?.full_name || "ชื่อผู้ใช้"}
          </div>
          <Link href="/checklist/profile">
            <span className="text-blue-400 text-xs hover:underline">
              แก้ไขโปรไฟล์
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          <ul className="space-y-2">
            <li>
              <Link href="/checklist">
                <span className="hover:underline">Checklist</span>
              </Link>
            </li>
            <li>
              <Link href="/checklist/summary">
                <span className="hover:underline">Summary</span>
              </Link>
            </li>
            <li>
              <Link href="/checklist/settings">
                <span className="hover:underline">Settings</span>
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
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
