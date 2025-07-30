import dynamic from "next/dynamic";
const Group4Page = dynamic(() => import("@/components/checklist/Group4Page"), { ssr: false });

export default function Group4() {
  return <Group4Page />;
}
