import dynamic from "next/dynamic";

const SettingsPage = dynamic(() => import("@/components/checklist/SettingsPage"), {
  ssr: false,
});

export default function Page() {
  return <SettingsPage />;
}
