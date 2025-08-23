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
import { useUserProfile } from "@/contexts/UserProfileContext"; // 👈 ใช้ Context

type ProfileRow = {
  full_name?: string | null;
  avatar_url?: string | null;
};

type Role = "owner" | "admin" | "member" | "auditor" | "partner";

function getActiveKey(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname === "/summary" || pathname.startsWith("/summary")) return "summary";
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return "settings";
  if (pathname === "/checklist") return "checklist";
  if (pathname.startsWith("/checklist/")) {
    const seg = pathname.split("/")[2] || ""; // group1..group6
    return `checklist:${seg}`;
  }
  return "";
}

const ALL_CHECKLIST_CHILDREN = [
  { key: "checklist:group1", href: "/checklist/group1", label: "กลยุทธ์องค์กร", icon: Target, perm: "view_checklist_group1" },
  { key: "checklist:group2", href: "/checklist/group2", label: "โครงสร้างองค์กร", icon: ChartNoAxesCombined, perm: "view_checklist_group2" },
  { key: "checklist:group3", href: "/checklist/group3", label: "คู่มือปฏิบัติงาน", icon: BookText, perm: "view_checklist_group3" },
  { key: "checklist:group4", href: "/checklist/group4", label: "ระบบบุคคล & HR", icon: Users, perm: "view_checklist_group4" },
  { key: "checklist:group5", href: "/checklist/group5", label: "ระบบการเงิน", icon: Wallet, perm: "view_checklist_group5" },
  { key: "checklist:group6", href: "/checklist/group6", label: "ระบบลูกค้า / ขาย", icon: ShoppingCart, perm: "view_checklist_group6" },
] as const;

// ---------- Rule: role -> default permissions ----------
function defaultPermissionsByRole(role: Role | undefined): Set<string> {
  switch (role) {
    case "owner":
      return new Set([
        "view_dashboard", "view_summary", "view_settings", "view_checklist",
        ...ALL_CHECKLIST_CHILDREN.map((c) => c.perm),
      ]);
    case "admin":
      return new Set([
        "view_dashboard", "view_summary", "view_settings", "view_checklist",
        ...ALL_CHECKLIST_CHILDREN.map((c) => c.perm),
      ]);
    case "member":
      return new Set([
        "view_dashboard", "view_checklist",
        "view_checklist_group3", "view_checklist_group4", "view_checklist_group6",
      ]);
    case "auditor":
      return new Set([
        "view_dashboard", "view_summary", "view_checklist",
        ...ALL_CHECKLIST_CHILDREN.map((c) => c.perm),
        // ไม่ให้แก้ settings โดยปกติ
      ]);
    case "partner":
      return new Set([
        "view_dashboard", "view_summary", "view_checklist",
        "view_checklist_group1", "view_checklist_group2", "view_checklist_group6",
      ]);
    default:
      // guest-like
      return new Set(["view_dashboard"]);
  }
}

// ---------- UI ----------
export default function Sidebar() {
  const router = useRouter();
  const activeKey = useMemo(() => getActiveKey(router.pathname), [router.pathname]);

  const { uid, role, permissions: userPermsFromCtx } = useUserProfile() || {};
  const effectivePerms = useMemo(() => {
    const base = defaultPermissionsByRole(role as Role | undefined);
    if (userPermsFromCtx && userPermsFromCtx.length > 0) {
      // merge เพิ่มสิทธิ์จาก server/context
      userPermsFromCtx.forEach((p) => base.add(p));
    }
    return base;
  }, [role, userPermsFromCtx]);

  // จำสถานะพับ/กาง ต่อผู้ใช้ (key ผูกกับ uid)
  const storageKey = uid ? `sidebar_checklist_expanded_${uid}` : "sidebar_checklist_expanded_anon";
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "1";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storageKey, expanded ? "1" : "0");
  }, [expanded, storageKey]);

  const [loggingOut, setLoggingOut] = useState(false);

  // โปรไฟล์
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // auto-expand เมื่ออยู่ภายใต้ /checklist/*
  useEffect(() => {
    if (activeKey.startsWith("checklist:")) setExpanded(true);
  }, [activeKey]);

  // โหลดข้อมูลโปรไฟล์ (ชื่อ + avatar)
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data: row, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) console.warn("โหลดโปรไฟล์ sidebar ผิดพลาด:", error);

      const fullName =
        row?.full_name || (user.user_metadata as any)?.full_name || user.email || "";
      const avatar = row?.avatar_url || (user.user_metadata as any)?.avatar_url || null;

      setProfile({ full_name: fullName, avatar_url: avatar });
      setAvatarUrl(avatar);
    })();
  }, []);

  const isActive = (key: string) => activeKey === key;

  const baseItem =
    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-slate-200 hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-blue-400/40";
  const activeItem =
    "bg-blue-600 text-white hover:bg-blue-600 shadow-sm ring-2 ring-blue-400/30";
  const childItem =
    "ml-9 mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700/60";
  const childActive = "bg-blue-600 text-white hover:bg-blue-600";

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();

      // เคลียร์ token cache ของ Supabase (sb-*)
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || "";
          if (k.startsWith("sb-")) keys.push(k);
        }
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {}

      const ok = await router.push("/login");
      if (!ok) window.location.assign("/login");
    } catch (err) {
      console.error("Logout failed", err);
      alert("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setLoggingOut(false);
    }
  }

  // ถ้ายังไม่มีสิทธิ์ดูเมนูหลักบางตัว ให้ไม่แสดง
  const can = (p: string) => effectivePerms.has(p);

  // Checklist click
  async function handleChecklistClick() {
    if (!router.pathname.startsWith("/checklist")) {
      setExpanded(true);
      await router.push("/checklist");
      return;
    }
    setExpanded((v) => !v);
  }

  // กรอง children ตามสิทธิ์
  const checklistChildren = ALL_CHECKLIST_CHILDREN.filter((c) => can(c.perm));

  return (
    <aside className="w-64 min-h-screen bg-slate-900 px-3 py-6">
      {/* Header / Avatar */}
      <div className="flex flex-col items-center gap-2 mb-6">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-16 h-16 rounded-full object-cover"
            onError={() => setAvatarUrl(null)}
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
        {can("view_dashboard") && (
          <Link
            href="/dashboard"
            className={`${baseItem} ${isActive("dashboard") ? activeItem : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
        )}

        {/* Summary */}
        {can("view_summary") && (
          <Link
            href="/summary"
            className={`${baseItem} ${isActive("summary") ? activeItem : ""}`}
          >
            <BookText size={18} />
            <span>Summary</span>
          </Link>
        )}

        {/* Checklist */}
        {can("view_checklist") && (
          <>
            <button
              type="button"
              onClick={handleChecklistClick}
              className={`${baseItem} w-full justify-between ${
                isActive("checklist") || activeKey.startsWith("checklist:")
                  ? "ring-1 ring-blue-400/40"
                  : ""
              }`}
            >
              <span className="flex items-center gap-3">
                <CheckSquare size={18} />
                <span>Checklist</span>
              </span>
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {/* Children */}
            {expanded && checklistChildren.length > 0 && (
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
          </>
        )}

        {/* Settings */}
        {can("view_settings") && (
          <Link
            href="/settings"
            className={`${baseItem} ${isActive("settings") ? activeItem : ""}`}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </Link>
        )}
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
