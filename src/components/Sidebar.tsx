import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  Target,
  ChartNoAxesCombined,
  BookText,
  Users,
  Wallet,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { supabase } from "@/utils/supabaseClient";

type ProfileRow = {
  full_name?: string | null;
  avatar_url?: string | null; // ✅ ใช้ avatar_url แทน avatar_path
};

function getActiveKey(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname === "/settings") return "settings";
  if (pathname === "/checklist") return "checklist";
  if (pathname.startsWith("/checklist/")) {
    const seg = pathname.split("/")[2] || ""; // group1..group6
    return `checklist:${seg}`;
  }
  return "";
}

const checklistChildren = [
  { key: "checklist:group1", href: "/checklist/group1", label: "กลยุทธ์องค์กร", icon: Target },
  { key: "checklist:group2", href: "/checklist/group2", label: "โครงสร้างองค์กร", icon: ChartNoAxesCombined },
  { key: "checklist:group3", href: "/checklist/group3", label: "คู่มือปฏิบัติงาน", icon: BookText },
  { key: "checklist:group4", href: "/checklist/group4", label: "ระบบบุคคล & HR", icon: Users },
  { key: "checklist:group5", href: "/checklist/group5", label: "ระบบการเงิน", icon: Wallet },
  { key: "checklist:group6", href: "/checklist/group6", label: "ระบบลูกค้า / ขาย", icon: ShoppingCart },
] as const;

export default function Sidebar() {
  const router = useRouter();
  const activeKey = useMemo(() => getActiveKey(router.pathname), [router.pathname]);

  const [expanded, setExpanded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // โปรไฟล์
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // auto-expand เมื่ออยู่ภายใต้ /checklist/*
  useEffect(() => {
    if (activeKey.startsWith("checklist:")) setExpanded(true);
  }, [activeKey]);

  // โหลดข้อมูลโปรไฟล์
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // ✅ อ่านจาก profiles.avatar_url
      const { data: row } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const fullName =
        row?.full_name || (user.user_metadata as any)?.full_name || user.email || "";
      const avatar = row?.avatar_url || (user.user_metadata as any)?.avatar_url || null;

      setProfile({ full_name: fullName, avatar_url: avatar });
      setAvatarUrl(avatar);
    })();
  }, []);

  const isActive = (key: string) => activeKey === key;

  const baseItem =
    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-slate-200 hover:bg-slate-700/60";
  const activeItem = "bg-blue-600 text-white hover:bg-blue-600 shadow-sm";
  const childItem =
    "ml-9 mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700/60";
  const childActive = "bg-blue-600 text-white hover:bg-blue-600";

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut({ scope: "global" } as any);

      // เคลียร์ token cache
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || "";
          if (k.startsWith("sb-")) keys.push(k);
        }
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {}

      await router.replace("/login");
      setTimeout(() => {
        if (window.location.pathname !== "/login") window.location.assign("/login");
      }, 150);
    } catch (err) {
      console.error("Logout failed", err);
      alert("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setLoggingOut(false);
    }
  }

  // ปุ่ม Checklist เดียว (สไตล์ Asana)
  async function handleChecklistClick() {
    if (!router.pathname.startsWith("/checklist")) {
      setExpanded(true);
      await router.push("/checklist");
      return;
    }
    setExpanded((v) => !v);
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 px-3 py-6">
      {/* Header / Avatar */}
      <div className="flex flex-col items-center gap-2 mb-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-700/60 flex items-center justify-center text-white text-lg">
            {(profile?.full_name || "U").slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="text-slate-100 text-sm font-medium">
          {profile?.full_name || "ผู้ใช้งาน"}
        </div>
      </div>

      <nav className="space-y-2">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`${baseItem} ${isActive("dashboard") ? activeItem : ""}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>

        {/* Checklist */}
        <button
          type="button"
          onClick={handleChecklistClick}
          className={`${baseItem} w-full justify-between ${
            isActive("checklist") || activeKey.startsWith("checklist:") ? "ring-1 ring-blue-400/40" : ""
          }`}
        >
          <span className="flex items-center gap-3">
            <CheckSquare size={18} />
            <span>Checklist</span>
          </span>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        {/* Children */}
        {expanded && (
          <div className="mt-1">
            {checklistChildren.map((c) => (
              <Link
                key={c.key}
                href={c.href}
                className={`${childItem} ${isActive(c.key) ? childActive : ""}`}
              >
                <c.icon size={16} />
                <span>{c.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          className={`${baseItem} ${isActive("settings") ? activeItem : ""}`}
        >
          <SettingsIcon size={18} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Logout */}
      <div className="mt-8">
        <button
          type="button"
          disabled={loggingOut}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white py-2.5 hover:bg-rose-500 disabled:opacity-60"
        >
          <LogOut size={18} />
          {loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
        </button>
      </div>
    </aside>
  );
}
