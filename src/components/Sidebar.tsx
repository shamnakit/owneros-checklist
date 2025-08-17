// src/components/Sidebar.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { useUserProfile } from "@/contexts/UserProfileContext";
import Image from "next/image";
import Link from "next/link";

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const router = useRouter();
  const isActive =
    router.pathname === href || router.pathname.startsWith(href + "/");

  const base =
    "flex items-center gap-2 px-4 py-2 rounded-md transition-colors";
  const activeCls = "bg-slate-800 text-white";
  const normalCls = "text-slate-300 hover:bg-slate-800/60 hover:text-white";

  return (
    <Link
      href={href}
      className={`${base} ${isActive ? activeCls : normalCls}`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { profile, loading, logout } = useUserProfile();
  const [busy, setBusy] = useState(false);

  const avatarSrc = profile?.avatar_url ?? profile?.company_logo_url ?? null;

  const handleLogout = async () => {
    try {
      setBusy(true);
      await logout();
    } catch (e) {
      alert("ออกจากระบบไม่สำเร็จ");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="flex flex-col justify-between h-screen p-4 bg-gray-900 text-white w-64">
      <div>
        {/* Avatar & Profile Info */}
        <div className="flex flex-col items-center mt-4 mb-6">
          {/* Avatar */}
          {loading ? (
            <div className="w-20 h-20 rounded-full bg-gray-700 animate-pulse" />
          ) : avatarSrc ? (
            <Image
              src={avatarSrc}
              alt="User Avatar"
              width={80}
              height={80}
              className="rounded-full border object-cover bg-white"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
              👤
            </div>
          )}

          {/* Texts */}
          <div className="text-center mt-2 w-full px-2">
            {loading ? (
              <>
                <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2 animate-pulse" />
                <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto mb-1 animate-pulse" />
                <div className="h-3 bg-gray-700 rounded w-2/3 mx-auto animate-pulse" />
              </>
            ) : (
              <>
                <div className="text-lg font-semibold">
                  {profile?.full_name || "ชื่อผู้ใช้"}
                </div>
                <div className="text-sm text-gray-400">
                  {profile?.position || "ตำแหน่ง"}
                </div>
                <div className="text-sm text-gray-300 mt-1 truncate">
                  {profile?.company_name || "ชื่อบริษัท"}
                </div>
                <Link
                  href="/checklist/profile"
                  className="text-blue-400 text-xs hover:underline block mt-1"
                >
                  แก้ไขโปรไฟล์
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <NavItem href="/dashboard" label="Dashboard" icon={"🏠"} />
          <NavItem href="/checklist" label="Checklist" icon={"📋"} />
          <NavItem href="/checklist/summary" label="Summary" icon={"📊"} />
          <NavItem href="/checklist/settings" label="Settings" icon={"⚙️"} />
        </nav>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        className={`${
          busy ? "opacity-70 cursor-not-allowed" : "hover:bg-red-700"
        } bg-red-600 text-white px-4 py-2 rounded text-sm mt-6`}
      >
        {busy ? "กำลังออก..." : "ออกจากระบบ"}
      </button>
    </aside>
  );
}
