import dynamic from "next/dynamic";

const MvpDashboard = dynamic(() => import("@/components/mvp/MvpDashboard"), { ssr: false });

export default function MvpPage() {
  return <MvpDashboard />;
}
