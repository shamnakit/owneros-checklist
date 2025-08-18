// src/components/Sidebar.tsx
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  BarChartBig,
  Settings,
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
import { useUserProfile } from "@/contexts/UserProfileContext";

/**
 * ACTIVE KEY MAPPING (หนึ่งค่าเท่านั้นในแต่ละหน้า)
 * "/" → dashboard
 * "/checklist" → checklist
 * "/checklist/<slug>" → checklist:<slug>
 * "/summary" → summary
 * "/settings" → settings
 */
function getActiveKey(pathname: string): string {
  if (pathname === "/" || pathname === "/dashboard") return "dashboard";
  if (pathname === "/summary") return "summary";
  if (pathname === "/settings") return "settings";
  if (pathname === "/checklist") return "checklist";
  if (pathname.startsWith("/checklist/")) {
    const slug = pathname.split("/")[2] || "";
    return `checklist:${slug}`;
  }
  return "";
}

const checklistChildren = [
  {
    key: "checklist:strategy",
    href: "/checklist/strategy",
    label: "กลยุทธ์องค์กร",
    icon: Target,
  },
  {
    key: "checklist:org-structure",
    href: "/checklist/org-structure",
    label: "โครงสร้างองค์กร",
    icon: ChartNoAxesCombined,
  },
  {
    key: "checklist:operations",
    href: "/checklist/operations",
    label: "คู่มือปฏิบัติงาน",
    icon: BookText,
  },
  {
    key: "checklist:hr",
    href: "/checklist/hr",
    label: "ระบบบุคคล & HR",
    icon: Users,
  },
  {
    key: "checklist:finance",
    href: "/checklist/finance",
    label: "ระบบการเงิน",
    icon: Wallet,
  },
  {
    key: "checklist:sales",
    href: "/checklist/sales",
    label: "ระบบลูกค้า / ขาย",
    icon: ShoppingCart,
  },
];

export default function Sidebar() {
  const router = useRouter();
  const activeKey = useMemo(() => getActiveKey(router.pathname), [router.pathname]);
  const { profile } = useUserProfile();
  const [expanded, setExpanded] = useState(false);

  // auto-expand เมื่ออยู่ภายใต้ /checklist/*
  useEffect(() => {
    if (activeKey.startsWith("checklist:")) setExpanded(true);
  }, [activeKey]);

  const isActive = (key: string) => activeKey === key;

  const baseItem =
    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-slate-200 hover:bg-slate-700/60";
  const activeItem =
    "bg-blue-600 text-white hover:bg-blue-600 shadow-sm";
  const childItem =
    "ml-9 mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700/60";
  const childActive = "bg-blue-600 text-white hover:bg-blue-600";

  return (
    <aside className="w-64 min-h-screen bg-slate-900 px-3 py-6">
      {/* Header / Profile small */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="w-16 h-16 rounded-full bg-slate-700/60" />
        <div className="h-3 w-40 rounded bg-slate-700/60" />
        <div className="h-3 w-28 rounded bg-slate-700/60" />
      </div>

      {/* MAIN */}
      <nav className="space-y-2">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`${baseItem} ${isActive("dashboard") ? activeItem : ""}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>

        {/* Checklist (parent) */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/checklist"
              className={`${baseItem} flex-1 ${isActive("checklist") ? activeItem : ""}`}
            >
              <CheckSquare size={18} />
              <span>Checklist</span>
            </Link>
            <button
              aria-label={expanded ? "Collapse" : "Expand"}
              onClick={() => setExpanded((v) => !v)}
              className="p-2 text-slate-300 hover:text-white"
            >
              {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

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
        </div>

        {/* Summary */}
        <Link
          href="/summary"
          className={`${baseItem} ${isActive("summary") ? activeItem : ""}`}
        >
          <BarChartBig size={18} />
          <span>Summary</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={`${baseItem} ${isActive("settings") ? activeItem : ""}`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Logout */}
      <div className="mt-8">
        <button
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white py-2.5 hover:bg-rose-500"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}

// ----------------------------------------------
// OPTIONAL: helper แยกไฟล์ได้ถ้าต้องการใช้ซ้ำ
// src/lib/nav.ts
export function activeKeyFrom(pathname: string) {
  return getActiveKey(pathname);
}
