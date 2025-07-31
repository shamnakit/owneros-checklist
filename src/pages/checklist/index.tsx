import dynamic from "next/dynamic";

const ChecklistDashboard = dynamic(() => import("@/components/ChecklistDashboard"), {
  ssr: false,
});

export default function ChecklistPage() {
  return <ChecklistDashboard />;
}
