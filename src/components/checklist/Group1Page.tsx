// ✅ โครงสร้างใหม่: Group1Page.tsx (sync จาก checklist_templates)

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/hooks/useUserProfile";

interface ChecklistItem {
  id: string;
  template_id: string;
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
    const group = "กลยุทธ์องค์กร";

    const fetchChecklist = async () => {
      const { data: existing, error: fetchError } = await supabase
        .from("checklists_v2")
        .select("*, checklist_templates(name)")
        .eq("group_name", group)
        .eq("year_version", year)
        .eq("user_id", profile.id);

      if (fetchError) {
        console.error("❌ Error fetching checklist:", fetchError);
        return;
      }

      if (existing.length > 0) {
        setItems(
          existing.map((c) => ({ ...c, name: c.checklist_templates?.name || "" }))
        );
        return;
      }

      // ✅ ยังไม่มี → ดึง template แล้วสร้างใหม่
      const { data: templates } = await supabase
        .from("checklist_templates")
        .select("id, name")
        .eq("group_name", group);

      if (!templates || templates.length === 0) {
        console.warn("⚠️ ไม่พบ template ใน checklist_templates");
        return;
      }

      const newItems = templates.map((t) => ({
        template_id: t.id,
        name: t.name,
        group_name: group,
        year_version: year,
        user_id: profile.id,
        input_text: null,
        file_path: null,
      }));

      const { data: inserted } = await supabase
        .from("checklists_v2")
        .insert(newItems)
        .select("*, checklist_templates(name)");

      setItems(
        inserted.map((c) => ({ ...c, name: c.checklist_templates?.name || "" }))
      );
    };

    fetchChecklist();
  }, [year, profile?.id]);

  const handleInputChange = (id: string, value: string) => {
    const updated_at = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, input_text: value, updated_at } : item
      )
    );
    supabase.from("checklists_v2").update({ input_text: value, updated_at }).eq("id", id);
  };

  const handleFileUpload = async (id: string, file: File) => {
    const filePath = `${profile.id}/${year}/${file.name}`;
    const { error } = await supabase.storage
      .from("checklist-files")
      .upload(filePath, file, { upsert: true });
    if (error) return console.error("Upload failed", error);

    const { data: publicUrl } = supabase.storage.from("checklist-files").getPublicUrl(filePath);
    const updated_at = new Date().toISOString();

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, file_path: publicUrl.publicUrl, updated_at } : item
      )
    );
    await supabase.from("checklists_v2").update({ file_path: publicUrl.publicUrl, updated_at }).eq("id", id);
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
            <div className="w-full md:w-1/6 text-sm font-medium text-center md:text-left">
              {isComplete(item) ? (
                <span className="text-green-600">✅ ทำแล้ว</span>
              ) : (
                <span className="text-yellow-600">⏳ ยังไม่ทำ</span>
              )}
            </div>

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
