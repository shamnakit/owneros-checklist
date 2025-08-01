import dynamic from "next/dynamic";

const SummaryPage = dynamic(() => import("@/components/checklist/SummaryPage"), {
  ssr: false,
});

export default function Summary() {
  return <SummaryPage />;
}
