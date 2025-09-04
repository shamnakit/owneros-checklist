// =========================
// src/components/admin/AdminSidebar.tsx
// =========================
import Link from "next/link";
import { useRouter } from "next/router";
import { BarChart2, Gauge, Activity, LogOut } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";


export default function AdminSidebar() {
const router = useRouter();
const isActive = (href: string) => router.pathname === href;


return (
<aside className="w-64 h-screen border-r border-neutral-800 p-4 bg-neutral-950 text-neutral-100 sticky top-0">
<div className="text-xl font-bold mb-6">Bizzystem Admin</div>
<nav className="space-y-1">
<Link href="/admin/analytics" className={`flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 ${isActive("/admin/analytics") ? "bg-neutral-900" : ""}`}>
<BarChart2 className="w-4 h-4" /> Analytics
</Link>
<Link href="/admin/analytics?tab=funnel" className={`flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 ${router.query.tab === "funnel" ? "bg-neutral-900" : ""}`}>
<Gauge className="w-4 h-4" /> Funnel
</Link>
<Link href="/admin/analytics?tab=interest" className={`flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 ${router.query.tab === "interest" ? "bg-neutral-900" : ""}`}>
<Activity className="w-4 h-4" /> Interest
</Link>
</nav>
<div className="mt-8 border-t border-neutral-800 pt-4">
<button
onClick={async () => { await supabase.auth.signOut(); router.replace("/admin/login"); }}
className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-900 w-full text-left"
>
<LogOut className="w-4 h-4" /> Logout
</button>
</div>
</aside>
);
}