// ✅ Group1Page.tsx แบบใหม่ใช้ checklist_templates และ checklists_v2
// ✅ UI 3 คอลัมน์: สถานะ | หัวข้อ + textarea | แนบไฟล์

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/hooks/useUserProfile";

interface ChecklistItem {
  id: string;
  template_id: string;
  user_id: string;
  year_version: number;
  input_text?: string;
  file_path?: string;
  updated_at?: string;
  template?: TemplateItem; // join result
}

interface TemplateItem {
  id: string;
  name: string;
  group_name: string;
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
      // ดึง checklist_v2 พร้อม join ชื่อ template
      const { data, error } = await supabase
        .from("checklists_v2")
        .select("*, template:template_id (id, name, group_name)")
        .eq("year_version", year)
        .eq("user_id", profile.id);

      if (error) {
        console.error("❌ Error fetching checklist_v2:", error);
        return;
      }

      if (data.length === 0) {
        // clone จาก template เฉพาะ group "กลยุทธ์องค์กร"
        const { data: templates } = await supabase
          .from("checklist_templates")
          .select("id")
          .eq("group_name", "กลยุทธ์องค์กร");

        if (!templates?.length) {
          console.warn("⚠️ ไม่พบ template สำหรับกลยุทธ์องค์กร");
          return;
        }

        const newChecklists = templates.map((t) => ({
          template_id: t.id,
          user_id: profile.id,
          year_version: year,
          input_text: null,
          file_path: null,
        }));

        const { error: insertError } = await supabase
          .from("checklists_v2")
          .upsert(newChecklists, {
            onConflict: "user_id,template_id,year_version",
            ignoreDuplicates: true,
          });

        if (insertError) {
          console.error("❌ Error inserting checklist_v2:", insertError);
          return;
        }

        // ✅ re-fetch
        const { data: newData } = await supabase
          .from("checklists_v2")
          .select("*, template:template_id (id, name, group_name)")
          .eq("year_version", year)
          .eq("user_id", profile.id);

        setItems(newData || []);
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
      .from("checklists_v2")
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
      .from("checklists_v2")
      .update({ file_path: fakePath, updated_at })
      .eq("id", id)
      .eq("user_id", profile.id);
  };

  const isComplete = (item: ChecklistItem) => {
    return (
      !!item.file_path || (item.input_text?.trim().length || 0) >= 100
    );
  };

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
            <option key={y} value={y}>ปี {y}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border flex flex-col md:flex-row md:items-start p-4 md:gap-6 shadow-sm"
          >
            {/* ซ้าย: สถานะ */}
            <div className="w-full md:w-1/6 text-sm font-medium text-center md:text-left">
              {isComplete(item) ? (
                <span className="text-green-600">✅ ทำแล้ว</span>
              ) : (
                <span className="text-yellow-600">⏳ ยังไม่ทำ</span>
              )}
            </div>

            {/* กลาง: หัวข้อ + textarea */}
            <div className="w-full md:w-4/6">
              <p className="font-semibold text-gray-800 mb-2">
                {item.template?.name || "(ไม่มีชื่อ)"}
              </p>
              <textarea
                placeholder="เพิ่มคำอธิบาย"
                className="w-full border rounded-md p-2 text-sm"
                rows={2}
                value={item.input_text || ""}
                onChange={(e) => handleInputChange(item.id, e.target.value)}
              />
            </div>

            {/* ขวา: แนบไฟล์ */}
            <div className="w-full md:w-1/6 flex md:justify-end items-center mt-3 md:mt-0">
              <label className="text-sm cursor-pointer text-blue-600 flex items-center gap-1">
                📎 แนบไฟล์
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(item.id, e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
