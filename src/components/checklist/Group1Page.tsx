// src/components/checklist/Group1Page.tsx
// ✅ Core-ready (MVP) — ตัด generics ของ supabase ออกเพื่อเลี่ยง ts(2589)

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/hooks/useUserProfile";

type UUID = string;
const GROUP_NAME = "กลยุทธ์องค์กร";
const yearOptions = [2024, 2025, 2026];

type TemplateRow = {
  id: UUID;
  name: string;
  index_number: number;
  group_name: string;
};

type ChecklistRow = {
  id: UUID;
  template_id: UUID;
  name: string;
  group_name: string;
  year_version: number;
  input_text: string | null;
  file_path: string | null;
  updated_at: string | null;
  user_id: UUID;
};

type ViewItem = ChecklistRow & { index_number: number; display_name: string };

function slugify(filename: string) {
  const i = filename.lastIndexOf(".");
  const base = (i >= 0 ? filename.slice(0, i) : filename)
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙_\- ]+/gi, "")
    .trim()
    .replace(/\s+/g, "-");
  const ext = i >= 0 ? filename.slice(i).toLowerCase() : "";
  return `${base}${ext}`;
}

export default function Group1Page() {
  const { profile } = useUserProfile();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [items, setItems] = useState<ViewItem[]>([]);
  const [editing, setEditing] = useState<Record<UUID, string>>({});
  const [loading, setLoading] = useState(false);

  // โหลด template ของกลุ่มนี้
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("id,name,index_number,group_name")
        .eq("group_name", GROUP_NAME)
        .order("index_number", { ascending: true });

      if (error) {
        console.error("❌ โหลด template ไม่ได้:", error);
        return;
      }
      if (active) setTemplates(((data ?? []) as unknown) as TemplateRow[]);
    })();
    return () => {
      active = false;
    };
  }, []);

  const templateMap = useMemo(() => {
    const m = new Map<string, TemplateRow>();
    templates.forEach((t) => m.set(t.id, t));
    return m;
  }, [templates]);

  // โหลด checklist ปีปัจจุบัน (ถ้าไม่มี → seed แล้วค่อยโหลดใหม่)
  useEffect(() => {
    if (!profile?.id || templates.length === 0) return;
    let active = true;

    const fetchOrSeed = async () => {
      setLoading(true);

      const { data: rows, error } = await supabase
        .from("checklists_v2")
        .select(
          "id,template_id,name,group_name,input_text,file_path,updated_at,year_version,user_id"
        )
        .eq("group_name", GROUP_NAME)
        .eq("year_version", year)
        .eq("user_id", profile.id);

      if (error) {
        console.error("❌ Error fetching checklist:", error);
        setLoading(false);
        return;
      }

      const existing = ((rows ?? []) as unknown) as ChecklistRow[];

      // ถ้ายังไม่มีรายการ → seed จาก template แล้ว re-fetch
      if (existing.length === 0) {
        const payload = templates.map((t) => ({
          user_id: profile.id,
          template_id: t.id,
          group_name: GROUP_NAME,
          name: t.name,
          year_version: year,
          input_text: null as string | null,
          file_path: null as string | null,
        }));

        const { error: upsertError } = await supabase
          .from("checklists_v2")
          .upsert(payload, {
            onConflict: "user_id,template_id,year_version",
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error("❌ Error seeding checklist:", upsertError);
          setLoading(false);
          return;
        }
      }

      // โหลดใหม่แล้ว merge กับ template เพื่อให้ชื่อ/ลำดับถูกต้อง
      const { data: latest, error: refetchErr } = await supabase
        .from("checklists_v2")
        .select(
          "id,template_id,name,group_name,input_text,file_path,updated_at,year_version,user_id"
        )
        .eq("group_name", GROUP_NAME)
        .eq("year_version", year)
        .eq("user_id", profile.id);

      if (refetchErr) {
        console.error("❌ Error refetch:", refetchErr);
        setLoading(false);
        return;
      }

      if (active) {
        const l = ((latest ?? []) as unknown) as ChecklistRow[];
        const merged: ViewItem[] = l.map((r) => {
          const t = templateMap.get(r.template_id);
          return {
            ...r,
            index_number: t?.index_number ?? 9999,
            display_name: t?.name ?? r.name,
          };
        });
        merged.sort((a, b) => a.index_number - b.index_number);
        setItems(merged);

        const e: Record<UUID, string> = {};
        merged.forEach((it) => (e[it.id] = it.input_text || ""));
        setEditing(e);
        setLoading(false);
      }
    };

    fetchOrSeed();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, profile?.id, templates.length]);

  const handleEditChange = (id: UUID, value: string) => {
    setEditing((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async (id: UUID) => {
    const value = editing[id] ?? "";
    const updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("checklists_v2")
      .update({ input_text: value, updated_at })
      .eq("id", id)
      .eq("user_id", profile!.id);

    if (error) {
      console.error("❌ Save error:", error);
      return;
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, input_text: value, updated_at } : it
      )
    );
  };

  const handleFileUpload = async (row: ViewItem, file: File) => {
    if (!profile?.id) return;

    const ts = Date.now();
    const safe = slugify(file.name);
    const path = `${profile.id}/${year}/${row.template_id}-${ts}-${safe}`;

    const { error: uploadErr } = await supabase.storage
      .from("checklist-files")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      console.error("❌ Upload error:", uploadErr);
      return;
    }

    const { data: pub } = supabase.storage
      .from("checklist-files")
      .getPublicUrl(path);
    const fileUrl = (pub?.publicUrl as string) || "";

    const updated_at = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("checklists_v2")
      .update({ file_path: fileUrl, updated_at })
      .eq("id", row.id)
      .eq("user_id", profile.id);

    if (updErr) {
      console.error("❌ Update file_path error:", updErr);
      return;
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === row.id ? { ...it, file_path: fileUrl, updated_at } : it
      )
    );
  };

  const isComplete = (it: ViewItem) =>
    !!it.file_path || (it.input_text?.trim().length || 0) >= 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold">Checklist หมวด 1: {GROUP_NAME}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">ปี:</span>
          <select
            className="border p-2 rounded-md"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-gray-500 text-sm">กำลังโหลดข้อมูล…</div>}

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
              {item.updated_at && (
                <div className="text-xs text-gray-500 mt-1">
                  อัปเดตล่าสุด:{" "}
                  {new Date(item.updated_at).toLocaleString("th-TH")}
                </div>
              )}
            </div>

            {/* กลาง: หัวข้อ + textarea + ปุ่มบันทึก */}
            <div className="w-full md:w-4/6">
              <p className="font-semibold text-gray-800 mb-2">
                {item.display_name}
              </p>
              <textarea
                placeholder="เพิ่มคำอธิบาย (อย่างน้อย 100 ตัวอักษร)"
                className="w-full border rounded-md p-2 text-sm"
                rows={3}
                value={editing[item.id] ?? ""}
                onChange={(e) => setEditing((p) => ({ ...p, [item.id]: e.target.value }))}
              />
              <div className="mt-2">
                <button
                  onClick={() => handleSave(item.id)}
                  className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  บันทึก
                </button>
              </div>
            </div>

            {/* ขวา: แนบไฟล์ + ดูไฟล์ */}
            <div className="w-full md:w-1/6 flex flex-col md:items-end gap-2 mt-3 md:mt-0">
              <label className="text-sm cursor-pointer text-blue-600 flex items-center gap-1">
                📎 แนบไฟล์
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(item, f);
                    e.currentTarget.value = "";
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
                    🔍 ดูไฟล์แนบ
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {!loading && items.length === 0 && (
          <div className="text-gray-500 text-sm">
            ไม่มีรายการในปีนี้ ระบบจะสร้างจากเทมเพลตอัตโนมัติ โปรดรีเฟรชอีกครั้ง
          </div>
        )}
      </div>
    </div>
  );
}
