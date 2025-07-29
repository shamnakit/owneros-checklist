// pages/checklist/summary.tsx
import MainLayout from "@/components/layouts/MainLayout";

export default function SummaryPage() {
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Summary</h1>
        <p>นี่คือหน้าสรุปผลการดำเนินงานของระบบ OwnerOS Checklist.</p>
        {/* เพิ่มกราฟ / รายงาน / ผลการประเมินต่าง ๆ ได้ที่นี่ */}
      </div>
    </MainLayout>
  );
}
