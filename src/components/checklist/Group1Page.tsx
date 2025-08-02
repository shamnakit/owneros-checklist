// ✅ React + Tailwind UI mockup สำหรับหน้า Checklist หมวด 1 (ทันสมัยแบบ SaaS)
// ✅ รองรับแนบไฟล์หรือพิมพ์ข้อความ (อย่างใดอย่างหนึ่ง), แยก "ทำแล้ว" และ "ยังไม่ทำ"
// ✅ เพิ่ม dropdown เลือกปี + clone checklist ใหม่เมื่อเปลี่ยนปี + mockup เชื่อมต่อ Supabase พร้อม user_id

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/hooks/useUserProfile";

interface ChecklistItem {
  id: string;
  name: string;
  file_path?: string;
  input_text?: string;
  updated_at?: string;
  year_version: number;
  user_id?: string;
}

const currentYear = new Date().getFullYear();
const yearOptions = [2024, 2025, 2026];

export default function Group1Page() {
  const { profile } = useUserProfile();
  const [year, setYear] = useState<number>(currentYear);
  const [items, setItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchOrCreateChecklist = async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("id, name, file_path, input_text, updated_at, year_version, user_id")
        .eq("group_name", "กลยุทธ์องค์กร")
        .eq("year_version", year)
        .eq("user_id", profile.id);

      if (error) {
        console.error("❌ Error fetching checklist:", error);
        return;
      }

      if (data.length === 0) {
        // ไม่มี checklist ปีนี้ → clone จากปีก่อน
        const { data: oldData } = await supabase
          .from("checklists")
          .select("name")
          .eq("group_name", "กลยุทธ์องค์กร")
          .eq("year_version", year - 1)
          .eq("user_id", profile.id);

        if (oldData?.length) {
          const newItems = oldData.map((item) => ({
            name: item.name,
            group_name: "กลยุทธ์องค์กร",
            year_version: year,
            file_path: null,
            input_text: null,
            user_id: profile.id,
          }));

          const { data: inserted } = await supabase
            .from("checklists")
            .insert(newItems)
            .select();

          setItems(inserted || []);
        }
      } else {
        setItems(data);
      }
    };

    fetchOrCreateChecklist();
  }, [year, profile?.id]);

  const handleInputChange = (id: string, value: string) => {
    const updated_at = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, input_text: value, updated_at } : item
      )
    );
    supabase
      .from("checklists")
      .update({ input_text: value, updated_at })
      .eq("id", id)
      .eq("user_id", profile.id);
  };

  const handleFileUpload = (id: string, file: File) => {
    const fakePath = `/uploads/${file.name}`;
    const updated_at = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, file_path: fakePath, updated_at } : item
      )
    );
    supabase
      .from("checklists")
      .update({ file_path: fakePath, updated_at })
      .eq("id", id)
      .eq("user_id", profile.id);
  };

  const isComplete = (item: ChecklistItem) => {
    return (
      !!item.file_path || (item.input_text?.trim().length || 0) >= 100
    );
  };

  const doneItems = items.filter(isComplete);
  const pendingItems = items.filter((item) => !isComplete(item));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Checklist หมวด 1: กลยุทธ์องค์กร</h1>
        <select
          className="border p-2 rounded-md"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              ปี {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ⏳ ยังไม่ทำ */}
        <div>
          <h2 className="text-lg font-semibold text-yellow-600 mb-3">
            ⏳ ยังไม่ทำ
          </h2>
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="bg-yellow-50 p-4 rounded-xl border border-yellow-200"
              >
                <p className="font-medium text-gray-800 mb-2">{item.name}</p>

                <textarea
                  placeholder="พิมพ์คำอธิบาย เช่น SWOT ที่คุณวิเคราะห์..."
                  className="w-full border rounded-md p-2 text-sm resize-none"
                  rows={4}
                  value={item.input_text || ""}
                  onChange={(e) => handleInputChange(item.id, e.target.value)}
                />

                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(item.id, e.target.files[0]);
                      }
                    }}
                  />
                  <span className="text-sm text-gray-500">
                    {item.input_text?.length || 0}/100 ตัวอักษร
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ ทำแล้ว */}
        <div>
          <h2 className="text-lg font-semibold text-green-600 mb-3">
            ✅ ทำแล้ว
          </h2>
          <div className="space-y-4">
            {doneItems.map((item) => (
              <div
                key={item.id}
                className="bg-green-50 p-4 rounded-xl border border-green-200"
              >
                <p className="font-medium text-gray-800 mb-1">{item.name}</p>

                {item.file_path ? (
                  <p className="text-sm text-green-700">
                    📎 แนบไฟล์แล้ว: <code>{item.file_path}</code>
                  </p>
                ) : (
                  <p className="text-sm text-green-700 whitespace-pre-wrap">
                    ✏️ {item.input_text}
                  </p>
                )}

                {item.updated_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    อัปเดตล่าสุด: {new Date(item.updated_at).toLocaleString("th-TH")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
