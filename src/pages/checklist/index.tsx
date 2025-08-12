import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import FileAttachment from "@/components/checklist/FileAttachment";

type Attachment = {
  id: string;
  path: string;           // ตัวอย่าง: "checklists/USER/ITEM/uuid-ts-name.png"
  stored_name: string;    // ตัวอย่าง: "uuid-ts-name.png"
  original_name?: string; // เช่น "male.png"
  bucket?: string;        // เช่น "attachments"
};

type ChecklistItem = {
  id: string;
  title: string;
  note?: string | null;
  attachment?: Attachment | null;
};

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดรายการ checklist + แนบไฟล์ (ปรับชื่อ table/column ให้ตรงของจริง)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("checklists_v2")
        .select(`
          id, title, note,
          attachment:checklist_attachments(
            id, path, stored_name, original_name, bucket
          )
        `)
        .order("id", { ascending: true });

      if (error) {
        console.error("โหลด checklist ผิดพลาด:", error);
        setItems([]);
      } else {
        setItems(
          (data || []).map((row: any) => ({
            id: row.id,
            title: row.title,
            note: row.note,
            attachment: row.attachment?.[0] ?? row.attachment ?? null, // เผื่อ join แบบ array
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, []);

  // สร้าง public URL จาก path/bucket
  const getPublicUrl = (att?: Attachment | null) => {
    if (!att?.path) return "";
    const bucket = att.bucket || "attachments"; // ตรงกับของโปรเจกต์คุณ
    const { data } = supabase.storage.from(bucket).getPublicUrl(att.path);
    return data?.publicUrl || "";
  };

  // ลบไฟล์แนบ (ตัวอย่าง)
  const handleDelete = async (att?: Attachment | null) => {
    if (!att?.path) return;
    const bucket = att.bucket || "attachments";

    // 1) ลบไฟล์ใน Storage
    const { error: storageErr } = await supabase.storage
      .from(bucket)
      .remove([att.path]);

    if (storageErr) {
      alert("ลบไฟล์ใน Storage ล้มเหลว");
      console.error(storageErr);
      return;
    }

    // 2) ลบข้อมูลเมทาดาท้าในตารางแนบไฟล์
    const { error: dbErr } = await supabase
      .from("checklist_attachments")
      .delete()
      .eq("id", att.id);

    if (dbErr) {
      console.error(dbErr);
    }

    // 3) refresh list
    setItems((prev) =>
      prev.map((it) =>
        it.attachment?.id === att.id ? { ...it, attachment: null } : it
      )
    );
  };

  if (loading) return <div className="p-6">กำลังโหลด…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Checklist หมวด 1: กลยุทธ์องค์กร</h1>

      {items.map((it) => {
        const url = getPublicUrl(it.attachment || undefined);
        return (
          <div key={it.id} className="rounded border p-4 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{it.title}</h2>
            </div>

            <div className="mt-3">
              <textarea
                defaultValue={it.note || ""}
                className="w-full min-h-[96px] rounded border p-2"
              />
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <span>ไฟล์แนบ:</span>
              <FileAttachment
                fileUrl={url}
                filePathOrName={it.attachment?.stored_name || it.attachment?.path}
                originalName={it.attachment?.original_name}
                onDelete={
                  it.attachment ? () => handleDelete(it.attachment!) : undefined
                }
              />
            </div>

            <div className="mt-4">
              <button className="px-4 py-2 rounded bg-blue-600 text-white">
                บันทึก
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
