import dynamic from "next/dynamic";

// ✅ ปิด SSR เพราะ Sidebar ใช้ useContext
const SummaryPage = dynamic(() => import("@/components/checklist/SummaryPage"), {
  ssr: false,
});

export default function Summary() {
  return <SummaryPage />;
}
