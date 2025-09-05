// =============================
// 1) src/components/admin/AdminTabs.tsx
// =============================
import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminTabs() {
  const router = useRouter();
  const base = "/admin/analytics";
  const path = router.pathname.replace(/\/$/, "");

  const tabs = [
    { label: "Overview", href: `${base}`, isActive: path === base || path === `${base}` },
    { label: "Funnel", href: `${base}/funnel`, isActive: path.startsWith(`${base}/funnel`) },
    { label: "Interest", href: `${base}/interest`, isActive: path.startsWith(`${base}/interest`) },
    { label: "Cohorts", href: `${base}/cohorts`, isActive: path.startsWith(`${base}/cohorts`) },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-2xl p-1 bg-neutral-900/40 border border-neutral-800 w-full">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`px-3 py-1.5 rounded-xl text-sm hover:bg-neutral-800 whitespace-nowrap ${
            t.isActive ? "bg-white text-black" : "text-neutral-300"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
