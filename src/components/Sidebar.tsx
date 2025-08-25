// src/components/Sidebar.tsx
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
  BookText, // ใช้เป็นไอคอนของ checklist group3
  Users,
  Wallet,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";

type Role = "owner" | "admin" | "member" | "auditor" | "partner";

function getActiveKey(pathname: string): string {
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "dashboard";
  // ❌ ตัด summary ออก
  if (pathname === "/settings" || pathname.startsWith("/settings")) return "settings";
  if (pathname === "/checklist") return "checklist";
  if (pathname.startsWith("/checklist/")) {
    const seg = pathname.split("/")[2] || "";
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

function defaultPermissionsByRole(role: Role): Set<string> {
  switch (role) {
    case "owner":
    case "admin":
      return new Set([
        "view_dashboard",
        "view_settings",
        "view_checklist",
        ...ALL_CHECKLIST_CHILDREN.map((c) => c.perm),
      ]);
    case "member":
      return new Set([
        "view_dashboard",
        "view_checklist",
        "view_checklist_group3",
        "view_checklist_group4",
        "view_checklist_group6",
      ]);
    case "auditor":
      return new Set([
        "view_dashboard",
        "view_checklist",
        ...ALL_CHECKLIST_CHILDREN.map((c) => c.perm),
      ]);
    case "partner":
      return new Set([
        "view_dashboard",
        "view_checklist",
        "view_checklist_group1",
        "view_checklist_group2",
        "view_checklist_group6",
      ]);
    default:
      return new Set(["view_dashboard"]);
  }
}

export default function Sidebar() {
  const router = useRouter();
  const activeKey = useMemo(() => getActiveKey(router.pathname), [router.pathname]);
  const { profile, role: roleFromCtx, permissions = [], logout } = useUserProfile();

  // Normalize role
  const normalizedRole: Role = useMemo(() => {
    const r = (roleFromCtx || "") as string;
    const allow = new Set(["owner", "admin", "member", "auditor", "partner"]);
    return allow.has(r) ? (r as Role) : "owner";
  }, [roleFromCtx]);

  const effectivePerms = useMemo(() => {
    const base = defaultPermissionsByRole(normalizedRole);
    permissions.forEach((p) => base.add(p));
    return base;
  }, [normalizedRole, permissions]);

  const can = (p: string) => effectivePerms.has(p);

  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (activeKey.startsWith("checklist:")) setExpanded(true);
  }, [activeKey]);

  const baseItem =
    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-slate-200 hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-blue-400/40";
  const activeItem =
    "bg-blue-600 text-white hover:bg-blue-600 shadow-sm ring-2 ring-blue-400/30";
  const childItem =
    "ml-9 mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700/60";
  const childActive = "bg-blue-600 text-white hover:bg-blue-600";

  return (
    <aside className="w-64 min-h-screen bg-slate-900 px-3 py-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 mb-6">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
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
        {can("view_dashboard") && (
          <Link
            href="/dashboard"
            className={`${baseItem} ${activeKey === "dashboard" ? activeItem : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
        )}

        {/* ❌ ตัด Summary ออก */}

        {can("view_checklist") && (
          <>
            <button
              type="button"
              onClick={async () => {
                if (!router.pathname.startsWith("/checklist")) {
                  setExpanded(true);
                  await router.push("/checklist");
                  return;
                }
                setExpanded((v) => !v);
              }}
              className={`${baseItem} w-full justify-between ${
                activeKey === "checklist" || activeKey.startsWith("checklist:")
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

            {expanded && (
              <div className="mt-1">
                {ALL_CHECKLIST_CHILDREN.filter((c) => can(c.perm)).map((c) => (
                  <Link
                    key={c.key}
                    href={c.href}
                    className={`${childItem} ${activeKey === c.key ? childActive : ""}`}
                  >
                    <c.icon size={16} />
                    <span>{c.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {can("view_settings") && (
          <Link
            href="/settings"
            className={`${baseItem} ${activeKey === "settings" ? activeItem : ""}`}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </Link>
        )}
      </nav>

      <div className="mt-8">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white py-2.5 hover:bg-rose-500"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
