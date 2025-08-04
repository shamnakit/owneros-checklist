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
  checklist_templates: { index_number: number }[];
}

const currentYear = new Date().getFullYear();
const yearOptions = [2024, 2025, 2026];

export default function Group1Page() {
  const { profile } = useUserProfile();
  const [year, setYear] = useState<number>(currentYear);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});

  // Sync editing state whenever items change
  useEffect(() => {
    const map: Record<string, string> = {};
    items.forEach((item) => {
      map[item.id] = item.input_text || "";
    });
    setEditing(map);
  }, [items]);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchOrCreateChecklist = async () => {
      // 1. Try fetch existing items
      const { data, error } = await supabase
        .from("checklists_v2")
        .select(`
          id,
          template_id,
          name,
          file_path,
          input_text,
          updated_at,
          year_version,
          user_id,
          checklist_templates ( index_number )
        `)
        .eq("group_name", "กลยุทธ์องค์กร")
        .eq("year_version", year)
        .eq("user_id", profile.id)
        .order("index_number", { foreignTable: "checklist_templates", ascending: true });

      if (error) {
        console.error("❌ Error fetching checklist:", error);
        return;
      }

      if (data && data.length > 0) {
        setItems(data);
        return;
      }

      // 2. No data for this year: insert from templates
      const { data: templateData, error: templateError } = await supabase
        .from("checklist_templates")
        .select("id, name, group_name, index_number")
        .eq("group_name", "กลยุทธ์องค์กร")
        .order("index_number", { ascending: true });

      if (templateError || !templateData?.length) {
        console.warn("❌ ไม่พบ template สำหรับกลยุทธ์องค์กร");
        return;
      }

      const newItems = templateData.map((t) => ({
        template_id: t.id,
        name: t.name,
        group_name: t.group_name,
        year_version: year,
        file_path: null,
        input_text: null,
        user_id: profile.id,
      }));

      const { error: insertError } = await supabase
        .from("checklists_v2")
        .insert(newItems);

      if (insertError) {
        console.warn("❌ Insert error, fetching existing items:", insertError);
      }

      // 3. Fetch again after insert
      const { data: finalData, error: finalError } = await supabase
        .from("checklists_v2")
        .select(`
          id,
          template_id,
          name,
          file_path,
          input_text,
          updated_at,
          year_version,
          user_id,
          checklist_templates ( index_number )
        `)
        .eq("group_name", "กลยุทธ์องค์กร")
        .eq("year_version", year)
        .eq("user_id", profile.id)
        .order("index_number", { foreignTable: "checklist_templates", ascending: true });

      if (finalError) {
        console.error("❌ Error fetching after insert:", finalError);
        return;
      }

      setItems(finalData || []);
    };

    fetchOrCreateChecklist();
  }, [year, profile?.id]);

  const saveInput = async (id: string) => {
    const value = editing[id] ?? "";
    const updated_at = new Date().toISOString();
    await supabase
      .from("checklists_v2")
      .update({ input_text: value, updated_at })
      .eq("id", id)
      .eq("user_id", profile.id);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, input_text: value, updated_at } : item
      )
    );
  };

  const handleFileUpload = async (id: string, file: File) => {
    const filePath = `${profile.id}/${year}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("checklist-files")
      .upload(filePath, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      return;
    }
    const { data: publicUrlData } = supabase.storage
      .from("checklist-files")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData?.publicUrl || "";
    const updated_at = new Date().toISOString();
    await supabase
      .from("checklists_v2")
      .update({ file_path: fileUrl, updated_at })
      .eq("id", id)
      .eq("user_id", profile.id);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, file_path: fileUrl, updated_at } : item
      )
    );
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

            <div className="w-full md:w-4/6 space-y-2">
              <p className="font-semibold text-gray-800">{item.name}</p>
              <textarea
                placeholder="เพิ่มคำอธิบาย (อย่างน้อย 100 ตัวอักษร)"
                className="w-full border rounded-md p-2 text-sm"
                rows={3}
                value={editing[item.id] ?? ""}
                onChange={(e) =>
                  setEditing((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
              />
              <button
                className="px-4 py-1 bg-blue-600 text-white rounded-md text-sm"
                onClick={() => saveInput(item.id)}
              >บันทึก</button>
            </div>

            <div className="w-full md:w-1/6 flex flex-col items-end gap-2 mt-3 md:mt-0">
              <label className="text-sm cursor-pointer text-blue-600 flex items-center gap-1">
                📎 แนบไฟล์
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])}
                />
              </label>
              {item.file_path && (
                <button
                  className="px-2 py-1 bg-gray-200 rounded-md text-xs"
                  onClick={() => window.open(item.file_path, '_blank')}
                >ดูไฟล์แนบ</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
