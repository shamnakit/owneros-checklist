import dynamic from "next/dynamic";

// ✅ dynamic import เพื่อปิด SSR
const DashboardPage = dynamic(() => import("@/components/DashboardPage"), { ssr: false });

export default function Dashboard() {
  return <DashboardPage />;
}
