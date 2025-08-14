// src/pages/checklist/index.tsx
import { useEffect, useState } from "react";
import {
  createChecklist,
  getChecklists,
  updateChecklist,
  deleteChecklist,
  type Checklist,
} from "@/services/checklistService";
import { supabase } from "@/utils/supabaseClient";

export default function ChecklistPage() {
  const [items, setItems] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // ฟอร์มสร้างใหม่
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // ตรวจสอบการล็อกอิน พร้อมโหลดข้อมูล
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setErrMsg(null);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user?.id) {
          setErrMsg("กรุณาล็อกอินก่อนใช้งาน");
          setItems([]);
          setLoading(false);
          return;
        }

        const data = await getChecklists();
        setItems(data);
      } catch (e: any) {
        setErrMsg(e?.message || "โหลดข้อมูลผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // สร้าง checklist ใหม่
  const handleCreate = async () => {
    if (!newTitle.trim()) {
      setErrMsg("กรุณากรอกชื่อรายการ");
      return;
    }
    try {
      setErrMsg(null);
      const created = await createChecklist({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
      });
      setItems((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDesc("");
    } catch (e: any) {
      setErrMsg(e?.message || "สร้างรายการไม่สำเร็จ");
    }
  };

  // เปลี่ยนชื่อ inline
  const handleRename = async (id: string, title: string) => {
    try {
      setErrMsg(null);
      const updated = await updateChecklist(id, { title });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
    } catch (e: any) {
      setErrMsg(e?.message || "อัปเดตไม่สำเร็จ");
    }
  };

  // ลบ
  const handleDelete = async (id: string) => {
    if (!confirm("ยืนยันการลบรายการนี้?")) return;
    try {
      setErrMsg(null);
      await deleteChecklist(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setErrMsg(e?.message || "ลบไม่สำเร็จ");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 840, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Checklist</h1>

      {/* กล่องแจ้งเตือน */}
      {errMsg && (
        <div
          style={{
            background: "#fff4f4",
            border: "1px solid #ffcccc",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <strong>เกิดข้อผิดพลาด:</strong> {errMsg}
        </div>
      )}

      {/* ฟอร์มสร้างใหม่ */}
      <div
        style={{
          background: "#f7f7f9",
          padding: 16,
          borderRadius: 12,
          marginBottom: 20,
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          สร้าง Checklist ใหม่
        </h2>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            placeholder="เช่น Company Readiness – Q3"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #d1d5db" }}
          />
          <textarea
            placeholder="คำอธิบาย (ถ้ามี)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={3}
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #d1d5db",
              resize: "vertical",
            }}
          />
          <div>
            <button
              onClick={handleCreate}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid #0ea5e9",
                background: "#0ea5e9",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + เพิ่ม Checklist
            </button>
          </div>
        </div>
      </div>

      {/* รายการ */}
      {loading ? (
        <div>กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div style={{ color: "#6b7280" }}>ยังไม่มีรายการ</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "space-between",
                }}
              >
                <input
                  defaultValue={it.title}
                  onBlur={(e) => {
                    const v = e.currentTarget.value.trim();
                    if (v && v !== it.title) handleRename(it.id, v);
                  }}
                  style={{
                    flex: 1,
                    fontWeight: 700,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <button
                  onClick={() => handleDelete(it.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #ef4444",
                    background: "#ef4444",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginLeft: 8,
                  }}
                >
                  ลบ
                </button>
              </div>

              {it.description ? (
                <div style={{ color: "#6b7280", marginTop: 6 }}>{it.description}</div>
              ) : null}
              <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 8 }}>
                created: {new Date(it.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
