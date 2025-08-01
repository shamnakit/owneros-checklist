import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/hooks/useUserProfile";

interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  is_done: boolean;
  file_path?: string;
}

export default function Group1Page() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { profile, loading: profileLoading } = useUserProfile(); // ✅ ดึง loading มาเช็กด้วย

  useEffect(() => {
    if (profileLoading) return; // ⛔ ยังโหลด profile อยู่
    if (!profile?.user_id) {
      console.warn("⛔ ไม่มี profile.user_id ขณะพยายามโหลด checklist");
      return;
    }

    const fetchChecklist = async () => {
      console.log("📥 เริ่มโหลด checklist สำหรับ user_id:", profile.user_id);

      const { data, error } = await supabase
        .from("checklists")
        .select("id, name, description, is_done, file_path")
        .eq("group_name", "กลยุทธ์องค์กร")
        .eq("user_id", profile.user_id);

      if (error) {
        console.error("❌ โหลด checklist ล้มเหลว:", error);
      } else {
        console.log("✅ โหลด checklist สำเร็จ:", data);
        setItems(data);
      }

      setLoading(false);
    };

    fetchChecklist();
  }, [profile?.user_id, profileLoading]);

  const toggleCheckbox = async (id: string, checked: boolean) => {
    await supabase.from("checklists").update({ is_done: checked }).eq("id", id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_done: checked } : item)));
  };

  const uploadFile = async (id: string, file: File) => {
    if (!profile?.user_id) return;

    setUploadingId(id);
    const filePath = `${profile.user_id}/${id}/${file.name}`;

    const { error: uploadError } = await supabase.storage.from("checklist-files").upload(filePath, file, {
      upsert: true,
    });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("checklist-files").getPublicUrl(filePath);
      await supabase.from("checklists").update({ file_path: filePath }).eq("id", id);

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, file_path: filePath } : item))
      );
    }

    setUploadingId(null);
  };

  if (profileLoading || loading) {
    return <div className="p-6 text-gray-500">กำลังโหลด...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Checklist หมวด 1: กลยุทธ์องค์กร</h1>

      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-800">{item.name}</p>
              <p className="text-sm text-gray-500">{item.description || "ไม่มีคำอธิบาย"}</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.is_done}
                onChange={(e) => toggleCheckbox(item.id, e.target.checked)}
                className="w-5 h-5"
              />

              <label className={item.file_path ? "text-green-600" : "text-yellow-500"}>
                {item.file_path ? "แนบแล้ว" : "ควรแนบไฟล์"}
              </label>

              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    uploadFile(item.id, e.target.files[0]);
                  }
                }}
                disabled={uploadingId === item.id}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
