import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  file_url?: string;
}

export default function Group1Page() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChecklist = async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("id, name, description, completed, file_url")
        .eq("category", "กลยุทธ์องค์กร");

      if (!error && data) {
        setItems(data);
      }
      setLoading(false);
    };

    fetchChecklist();
  }, []);

  const toggleCheckbox = async (id: string, checked: boolean) => {
    await supabase.from("checklists").update({ completed: checked }).eq("id", id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed: checked } : item)));
  };

  const uploadFile = async (id: string, file: File) => {
    setUploadingId(id);
    const filePath = `checklists/${id}/${file.name}`;

    const { error: uploadError } = await supabase.storage.from("attachments").upload(filePath, file, {
      upsert: true,
    });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(filePath);
      await supabase.from("checklists").update({ file_url: urlData.publicUrl }).eq("id", id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, file_url: urlData.publicUrl } : item))
      );
    }

    setUploadingId(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Checklist หมวด 1: กลยุทธ์องค์กร</h1>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => toggleCheckbox(item.id, e.target.checked)}
                  className="w-5 h-5"
                />

                <label className={item.file_url ? "text-green-600" : "text-yellow-500"}>
                  {item.file_url ? "แนบแล้ว" : "ควรแนบไฟล์"}
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
      )}
    </div>
  );
}
