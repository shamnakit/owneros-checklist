import dynamic from "next/dynamic";

const MainLayout = dynamic(() => import("@/layouts/MainLayout"), { ssr: false });
const SummaryPage = dynamic(() => import("@/components/checklist/SummaryPage"), { ssr: false });

export default function Page() {
  return (
    <MainLayout>
      <SummaryPage />
    </MainLayout>
  );
}
