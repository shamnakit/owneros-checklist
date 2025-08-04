// ✅ Group1Page.tsx – ใช้ checklist_templates เป็นแหล่งตั้งต้น
// ✅ ไม่ซ้ำ ID เดิม, ไม่ดึงจากปีเก่าลงมาโดยตรงอีกต่อไป

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
        .from("checklists_v2")
        .select("*")
        .eq("group_name", "กลยุทธ์องค์กร")
        .eq("year_version", year)
        .eq("user_id", profile.id);

      if (error) {
        console.error("❌ Error fetching checklist:", error);
        return;
      }

      if (data.length === 0) {
        console.warn("📦 No checklist found. Creating from template...");

        const { data: templates, error: templateError } = await supabase
          .from("checklist_templates")
          .select("name")
          .eq("group_name", "กลยุทธ์องค์กร");

        if (templateError || !templates || templates.length === 0) {
          console.error("❌ Template not found:", templateError);
          return;
        }

        const newItems = templates.map((item) => ({
          name: item.name,
          group_name: "กลยุทธ์องค์กร",
          year_version: year,
          file_path: null,
          input_text: null,
          user_id: profile.id,
        }));

        const { data: inserted, error: insertError } = await supabase
          .from("checklists_v2")
          .insert(newItems)
          .select();

        if (insertError) {
          console.error("❌ Error inserting new checklist:", insertError);
          return;
        }

        setItems(inserted || []);
      } else {
        setItems(data);
      }
    };

    fetchOrCreateChecklist();
  }, [year, profile?.id]);

  const handleInputChange = async (id: string, value: string) => {
    const updated_at = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, input_text: value, updated_at } : item
      )
    );
    await supabase
      .from("checklists_v2")
      .update({ input_text: value, updated_at })
      .eq("id", id)
      .eq("user_id", profile.id);
  };

  const handleFileUpload = async (id: string, file: File) => {
    const filePath = `${profile.id}/${year}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("checklist-files")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("checklist-files")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData?.publicUrl || "";
    const updated_at = new Date().toISOString();

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, file_path: fileUrl, updated_at } : item
      )
    );

    await supabase
      .from("checklists_v2")
      .update({ file_path: fileUrl, updated_at })
      .eq("id", id)
      .eq("user_id", profile.id);
  };

  const isComplete = (item: ChecklistItem) => {
    return !!item.file_path || (item.input_text?.trim().length || 0) >= 100;
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
              <p className="font-semibold text-gray-800 mb-2">{item.name}</p>
              <textarea
                placeholder="เพิ่มคำอธิบาย (อย่างน้อย 100 ตัวอักษร)"
                className="w-full border rounded-md p-2 text-sm"
                rows={3}
                value={item.input_text || ""}
                onChange={(e) => handleInputChange(item.id, e.target.value)}
              />
            </div>

            {/* ขวา: แนบไฟล์ + แสดงชื่อ + ลิงก์ดูไฟล์ */}
            <div className="w-full md:w-1/6 flex flex-col md:items-end gap-1 mt-3 md:mt-0">
              <label className="text-sm cursor-pointer text-blue-600 flex items-center gap-1">
                📎 แนบไฟล์
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(item.id, e.target.files[0]);
                    }
                  }}
                />
              </label>
              {item.file_path && (
                <div className="text-xs text-right space-y-1">
                  <p className="text-gray-600 truncate max-w-full">
                    📄 {item.file_path.split("/").pop()}
                  </p>
                  <a
                    href={item.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    🔍 ดูไฟล์
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
