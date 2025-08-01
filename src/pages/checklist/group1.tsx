import dynamic from "next/dynamic";

const Group1Page = dynamic(() => import("@/components/checklist/Group1Page"), { ssr: false });

export default function Group1() {
  return <Group1Page />;
}
