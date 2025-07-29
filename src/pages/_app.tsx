// ✅ _app.tsx (แก้ไข Layout ให้แสดง Sidebar ทุกหน้าใน /checklist ยกเว้นหน้า login)
import MainLayout from "@/layouts/MainLayout";
import "@/styles/globals.css";
import { useRouter } from "next/router";
import { UserProfileProvider } from "@/contexts/UserProfileContext";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const hideSidebar = router.pathname === "/checklist/login";
  const useLayout = router.pathname.startsWith("/checklist") && !hideSidebar;

  const Layout = useLayout ? MainLayout : ({ children }) => <>{children}</>;

  return (
    <UserProfileProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserProfileProvider>
  );
}

export default MyApp;

// ✅ Sidebar.tsx (แก้ลิงก์ให้คลิกได้จริง)
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
