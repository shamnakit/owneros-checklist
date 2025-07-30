import dynamic from "next/dynamic";
const Group2Page = dynamic(() => import("@/components/checklist/Group2Page"), { ssr: false });

export default function Group2() {
  return <Group2Page />;
}
