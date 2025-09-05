//src/components/admin/AdminSidebar.tsx

import Link from "next/link";
import { useRouter } from "next/router";
import {
  BarChart2,
  Users,         // ใช้ Users (ไม่มี Users2 ในบางเวอร์ชัน)
  ShieldCheck,
  Layers,
  Database,
  Gauge,
  ListChecks,
  FileArchive,
  CreditCard,
  Settings as SettingsIcon,
  LogOut,
  GitBranch,     // แทน Workflow
} from "lucide-react";
import { supabase } from "@/utils/supabaseClient";

export default function AdminSidebar() {
  const router = useRouter();
  const isActive = (href: string) =>
    router.asPath === href || router.asPath.startsWith(href + "/");

  const Item = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 ${
        isActive(href) ? "bg-neutral-900 text-white" : "text-neutral-300"
      }`}
    >
      {children}
    </Link>
  );

  return (
    <aside className="w-64 h-screen border-r border-neutral-800 p-4 bg-neutral-950 text-neutral-100 sticky top-0">
      <div className="text-xl font-bold mb-6">Bizzystem Admin</div>
      <nav className="space-y-1">
        <Item href="/admin">
          <Gauge className="w-4 h-4" /> Overview
        </Item>
        <Item href="/admin/analytics">
          <BarChart2 className="w-4 h-4" /> Analytics
        </Item>
        <Item href="/admin/users">
          <Users className="w-4 h-4" /> Users & RBAC
        </Item>
        <Item href="/admin/evidence">
          <ListChecks className="w-4 h-4" /> Evidence
        </Item>
        <Item href="/admin/workflow">
          <GitBranch className="w-4 h-4" /> Workflow
        </Item>
        <Item href="/admin/dataroom">
          <Database className="w-4 h-4" /> Data Room
        </Item>
        <Item href="/admin/kpi">
          <Gauge className="w-4 h-4" /> KPI & Scoring
        </Item>
        <Item href="/admin/audit">
          <ShieldCheck className="w-4 h-4" /> Audit Log
        </Item>
        <Item href="/admin/exports">
          <FileArchive className="w-4 h-4" /> Exports & Binder
        </Item>
        <Item href="/admin/billing">
          <CreditCard className="w-4 h-4" /> Billing
        </Item>
        <Item href="/admin/settings">
          <SettingsIcon className="w-4 h-4" /> Settings
        </Item>
      </nav>

      <div className="mt-8 border-t border-neutral-800 pt-4">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/admin/login");
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 w-full text-left text-neutral-300"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
