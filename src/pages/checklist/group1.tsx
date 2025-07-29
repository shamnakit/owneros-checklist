// pages/checklist/group1.tsx
import dynamic from "next/dynamic";

const MainLayout = dynamic(() => import("@/layouts/MainLayout"), { ssr: false });
const Group1Page = dynamic(() => import("@/components/checklist/Group1Page"), { ssr: false });

export default function Group1() {
  return (
    <MainLayout>
      <Group1Page />
    </MainLayout>
  );
}
