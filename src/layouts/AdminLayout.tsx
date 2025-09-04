// =========================
// src/layouts/AdminLayout.tsx
// =========================
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdminGuard } from "@/hooks/useAdminGuard";


export default function AdminLayout({ children }: { children: React.ReactNode }) {
const { ready, allowed } = useAdminGuard();
if (!ready) return <div className="p-8 text-neutral-400">Loading admin…</div>;
if (!allowed) return null; // will redirect by guard


return (
<div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
<AdminSidebar />
<main className="flex-1 p-6">
{children}
</main>
</div>
);
}