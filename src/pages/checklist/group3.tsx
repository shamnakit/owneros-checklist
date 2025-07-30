import dynamic from "next/dynamic";
const Group3Page = dynamic(() => import("@/components/checklist/Group3Page"), { ssr: false });

export default function Group3() {
  return <Group3Page />;
}
