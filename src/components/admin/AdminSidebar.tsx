import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  BarChart2,
  Users,
  ListChecks,
  GitBranch,
  Database,
  Gauge,
  ShieldCheck,
  FileArchive,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "@/utils/supabaseClient";

function NavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  const router = useRouter();
  const active = router.asPath === href || router.asPath.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 ${
        active ? "bg-neutral-900 text-white" : "text-neutral-300"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

export default function AdminSidebar() {
  return (
    <aside className="w-64 h-screen border-r border-neutral-800 p-4 bg-neutral-950 text-neutral-100 sticky top-0">
      <div className="text-xl font-bold mb-6">Bizzystem Admin</div>

      {/* Global nav */}
      <nav className="space-y-1">
        <NavItem href="/admin" label="Overview" icon={LayoutDashboard} />
        <NavItem href="/admin/analytics" label="Analytics" icon={BarChart2} />
        <NavItem href="/admin/users" label="Users & RBAC" icon={Users} />
        <NavItem href="/admin/evidence" label="Evidence" icon={ListChecks} />
        <NavItem href="/admin/workflow" label="Workflow" icon={GitBranch} />
        <NavItem href="/admin/dataroom" label="Data Room" icon={Database} />
        <NavItem href="/admin/kpi" label="KPI & Scoring" icon={Gauge} />
        <NavItem href="/admin/audit" label="Audit Log" icon={ShieldCheck} />
        <NavItem href="/admin/exports" label="ดาวน์โหลดรายงาน" icon={FileArchive} />
        <NavItem href="/admin/billing" label="Billing" icon={CreditCard} />
        <NavItem href="/admin/settings" label="Settings" icon={Settings} />
      </nav>

      <div className="mt-8 border-t border-neutral-800 pt-4">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/admin/login";
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 w-full text-left text-neutral-300"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
