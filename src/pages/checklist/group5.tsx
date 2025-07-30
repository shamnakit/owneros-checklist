import dynamic from "next/dynamic";
const Group5Page = dynamic(() => import("@/components/checklist/Group5Page"), { ssr: false });

export default function Group5() {
  return <Group5Page />;
}
