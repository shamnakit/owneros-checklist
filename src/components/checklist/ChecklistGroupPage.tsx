// src/components/checklist/ChecklistGroupPage.tsx
// Generic version ของหน้า Group (มี Export PDF + Filters + Toast)
// ใช้กับทุกหมวด: ส่ง props { groupName, groupNo }

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useUserProfile } from "@/hooks/useUserProfile";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type UUID = string;
const yearOptions = [2024, 2025, 2026];

type TemplateRow = { id: UUID; name: string; index_number: number; group_name: string };
type ChecklistRow = {
  id: UUID; template_id: UUID; name: string; group_name: string;
  year_version: number; input_text: string | null; file_path: string | null;
  file_key: string | null; updated_at: string | null; user_id: UUID;
};
type ViewItem = ChecklistRow & { index_number: number; display_name: string };
type Filter = "ALL" | "PENDING" | "TEXT_ONLY" | "WITH_FILE";
type ToastType = "success" | "error" | "info";

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
function prettyFileName(row: ViewItem) {
  const raw = row.file_key?.split("/").pop() || row.file_path?.split("/").pop() || "";
  const parts = raw.split("-");
  const tsIdx = parts.findIndex((p) => /^\d{10,}$/.test(p)); // timestamp >= 10 หลัก
  if (tsIdx !== -1) return parts.slice(tsIdx + 1).join("-");
  return raw.replace(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}-/i, "");
}
function truncate(s: string, n = 150) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
function Toast({ type, message }: { type: ToastType; message: string }) {
  const color =
    type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-slate-700";
  return (
    <div className={`fixed bottom-6 right-6 z-50 text-white px-4 py-2 rounded-lg shadow-lg ${color}`}>
      {message}
    </div>
  );
}

export default function ChecklistGroupPage({
  groupName,
  groupNo,
}: {
  groupName: string;
  groupNo: number;
}) {
  const { profile } = useUserProfile();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [items, setItems] = useState<ViewItem[]>([]);
  const [editing, setEditing] = useState<Record<UUID, string>>({});
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState<Filter>("ALL");
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2200);
  };

  // ✅ ประกาศ printRef แค่ครั้งเดียว
  const printRef = useRef<HTMLDivElement>(null);

  // โหลด template
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("id,name,index_number,group_name")
        .eq("group_name", groupName)
        .order("index_number", { ascending: true });

      if (error) {
        console.error(error);
        showToast("โหลดเทมเพลตไม่สำเร็จ", "error");
        return;
      }
      if (active) setTemplates(((data ?? []) as unknown) as TemplateRow[]);
    })();
    return () => {
      active = false;
    };
  }, [groupName]);

  const templateMap = useMemo(() => {
    const m = new Map<string, TemplateRow>();
    templates.forEach((t) => m.set(t.id, t));
    return m;
  }, [templates]);

  // โหลด/seed checklist ของปี
  useEffect(() => {
    if (!profile?.id || templates.length === 0) return;
    let active = true;

    const fetchOrSeed = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("checklists_v2")
        .select(
          "id,template_id,name,group_name,input_text,file_path,file_key,updated_at,year_version,user_id"
        )
        .eq("group_name", groupName)
        .eq("year_version", year)
        .eq("user_id", profile.id);

      if (error) {
        console.error(error);
        showToast("โหลดรายการไม่สำเร็จ", "error");
        setLoading(false);
        return;
      }

      const existing = ((rows ?? []) as unknown) as ChecklistRow[];
      if (existing.length === 0) {
        const payload = templates.map((t) => ({
          user_id: profile.id,
          template_id: t.id,
          group_name: groupName,
          name: t.name,
          year_version: year,
          input_text: null as string | null,
          file_path: null as string | null,
          file_key: null as string | null,
        }));
        const { error: upsertError } = await supabase
          .from("checklists_v2")
          .upsert(payload, {
            onConflict: "user_id,template_id,year_version",
            ignoreDuplicates: false,
          });
        if (upsertError) {
          console.error(upsertError);
          showToast("สร้างรายการจากเทมเพลตไม่สำเร็จ", "error");
          setLoading(false);
          return;
        }
      }

      const { data: latest, error: refetchErr } = await supabase
        .from("checklists_v2")
        .select(
          "id,template_id,name,group_name,input_text,file_path,file_key,updated_at,year_version,user_id"
        )
        .eq("group_name", groupName)
        .eq("year_version", year)
        .eq("user_id", profile.id);

      if (refetchErr) {
        console.error(refetchErr);
        showToast("โหลดรายการไม่สำเร็จ", "error");
        setLoading(false);
        return;
      }

      if (active) {
        const l = ((latest ?? []) as unknown) as ChecklistRow[];
        const merged: ViewItem[] = l
          .map((r) => {
            const t = templateMap.get(r.template_id);
            return {
              ...r,
              index_number: t?.index_number ?? 9999,
              display_name: t?.name ?? r.name,
            };
          })
          .sort((a, b) => a.index_number - b.index_number);

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
  }, [year, profile?.id, templates.length, groupName, templateMap]);

  const handleSave = async (id: UUID) => {
    const value = editing[id] ?? "";
    const updated_at = new Date().toISOString();
    const { error } = await supabase
      .from("checklists_v2")
      .update({ input_text: value, updated_at })
      .eq("id", id)
      .eq("user_id", profile!.id);
    if (error) {
      console.error(error);
      showToast("บันทึกไม่สำเร็จ", "error");
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, input_text: value, updated_at } : it))
    );
    showToast("บันทึกแล้ว ✅", "success");
  };

  const handleFileUpload = async (row: ViewItem, file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) {
        showToast("ไฟล์ใหญ่เกิน 10MB", "error");
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) {
        showToast("ไม่พบ session ผู้ใช้", "error");
        return;
      }
      const ts = Date.now();
      const safe = slugify(file.name);
      const newKey = `${uid}/${year}/${row.template_id}-${ts}-${safe}`;

      const { error: uploadErr } = await supabase.storage
        .from("checklist-files")
        .upload(newKey, file, { upsert: true, contentType: file.type });
      if (uploadErr) {
        console.error(uploadErr);
        showToast("อัปโหลดไฟล์ไม่สำเร็จ", "error");
        return;
      }

      const { data: pub } = supabase.storage
        .from("checklist-files")
        .getPublicUrl(newKey);
      const newUrl = (pub?.publicUrl as string) || "";

      const updated_at = new Date().toISOString();
      const { error: updErr } = await supabase
        .from("checklists_v2")
        .update({ file_path: newUrl, file_key: newKey, updated_at })
        .eq("id", row.id)
        .eq("user_id", profile!.id);
      if (updErr) {
        console.error(updErr);
        showToast("บันทึกไฟล์ลงฐานข้อมูลไม่สำเร็จ", "error");
        return;
      }

      if (row.file_key) {
        const { error: delErr } = await supabase.storage
          .from("checklist-files")
          .remove([row.file_key]);
        if (delErr) console.warn("⚠️ ลบไฟล์เก่าไม่ได้:", delErr);
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === row.id
            ? { ...it, file_path: newUrl, file_key: newKey, updated_at }
            : it
        )
      );
      showToast("อัปโหลดไฟล์เรียบร้อย ✅", "success");
    } catch (e) {
      console.error(e);
      showToast("เกิดข้อผิดพลาดระหว่างอัปโหลดไฟล์", "error");
    }
  };

  const handleFileDelete = async (row: ViewItem) => {
    if (!row.file_key) return;
    const { error: delErr } = await supabase.storage
      .from("checklist-files")
      .remove([row.file_key]);
    if (delErr) {
      console.error(delErr);
      showToast("ลบไฟล์จากสตอเรจไม่ได้", "error");
      return;
    }

    const updated_at = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("checklists_v2")
      .update({ file_path: null, file_key: null, updated_at })
      .eq("id", row.id)
      .eq("user_id", profile!.id);
    if (updErr) {
      console.error(updErr);
      showToast("อัปเดตฐานข้อมูลไม่สำเร็จ", "error");
      return;
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === row.id ? { ...it, file_path: null, file_key: null, updated_at } : it
      )
    );
    showToast("ลบไฟล์เรียบร้อย ✅", "success");
  };

  const isComplete = (it: ViewItem) =>
    !!it.file_key || (it.input_text?.trim().length || 0) >= 100;
  const isTextOnly = (it: ViewItem) =>
    !it.file_key && (it.input_text?.trim().length || 0) >= 100;

  const stats = useMemo(() => {
    const total = items.length || 1;
    const withFile = items.filter((x) => !!x.file_key).length;
    const textOnly = items.filter(isTextOnly).length;
    const pending = items.length - withFile - textOnly;
    const percent = Math.round(((withFile + textOnly) / total) * 100);
    return { total: items.length, withFile, textOnly, pending, percent };
  }, [items]);

  const filteredItems = useMemo(() => {
    switch (filter) {
      case "PENDING":
        return items.filter((x) => !isComplete(x));
      case "TEXT_ONLY":
        return items.filter(isTextOnly);
      case "WITH_FILE":
        return items.filter((x) => !!x.file_key);
      default:
        return items;
    }
  }, [items, filter]);

  // -------- Export PDF (Option A) ----------
  const doExportPDF = async () => {
    if (!printRef.current) return;
    if (items.length === 0) {
      showToast("ยังไม่มีรายการสำหรับส่งออก", "info");
      return;
    }
    try {
      setExporting(true);

      const node = printRef.current;
      node.classList.remove("hidden");
      node.style.position = "fixed";
      node.style.left = "-10000px";
      node.style.top = "0";
      node.style.width = "794px"; // ~ A4 width in px @96dpi
      node.style.background = "#ffffff";
      await new Promise((r) => setTimeout(r, 50));

      const scale = Math.max(2, Math.min(3, window.devicePixelRatio || 2));
      const canvas = await html2canvas(node, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
      });

      node.classList.add("hidden");
      node.removeAttribute("style");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const pageHeightPx = Math.round((imgWidthPx * pageHeight) / pageWidth);

      let positionPx = 0;
      let pageIndex = 0;

      while (positionPx < imgHeightPx) {
        const sliceHeightPx = Math.min(pageHeightPx, imgHeightPx - positionPx);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = imgWidthPx;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext("2d")!;
        ctx.drawImage(
          canvas,
          0,
          positionPx,
          imgWidthPx,
          sliceHeightPx,
          0,
          0,
          imgWidthPx,
          sliceHeightPx
        );

        const imgData = pageCanvas.toDataURL("image/png");
        const imgHeightMm = (sliceHeightPx * pageWidth) / imgWidthPx;

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeightMm, undefined, "FAST");

        positionPx += sliceHeightPx;
        pageIndex += 1;
      }

      const safeCompany = (profile?.company_name || "OwnerOS").replace(
        /[^\wก-๙\- ]+/gi,
        "_"
      );
      pdf.save(`${safeCompany}-Checklist-หมวด${groupNo}-${groupName}-${year}.pdf`);
      showToast("ดาวน์โหลดไฟล์ PDF แล้ว ✅", "success");
    } catch (err) {
      console.error(err);
      showToast("สร้าง PDF ไม่สำเร็จ", "error");
    } finally {
      setExporting(false);
    }
  };
  // -----------------------------------------

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold">
          Checklist หมวด {groupNo}: {groupName}
        </h1>
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

      {/* Sticky Summary */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border rounded-xl p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Progress */}
          <div className="min-w-[260px]">
            <div className="text-sm text-gray-700 mb-1">
              ความคืบหน้าหมวดนี้:{" "}
              <span className="font-semibold">{stats.percent}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-md overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ครบพร้อมไฟล์: {stats.withFile} • ครบยังไม่มีไฟล์: {stats.textOnly} •
              ยังไม่ทำ: {stats.pending}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "ALL", label: "ทั้งหมด" },
              { key: "PENDING", label: "ยังไม่ทำ" },
              { key: "TEXT_ONLY", label: "ติ๊กแล้วแต่ไม่มีไฟล์" },
              { key: "WITH_FILE", label: "ทำแล้วมีไฟล์" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as Filter)}
                className={`px-3 py-1.5 text-sm rounded-full border ${
                  filter === f.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Export PDF */}
          <div className="flex items-center gap-2">
            <button
              onClick={doExportPDF}
              disabled={exporting || items.length === 0}
              className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              title="ส่งออกเป็น PDF"
            >
              {exporting ? "กำลังสร้าง PDF..." : "Export PDF"}
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="text-gray-500 text-sm">กำลังโหลดข้อมูล…</div>}

      {/* Items */}
      <div className="space-y-4">
        {filteredItems.map((item) => {
          const textLen = editing[item.id]?.trim().length || 0;
          return (
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

              {/* กลาง */}
              <div className="w-full md:w-4/6">
                <p className="font-semibold text-gray-800 mb-2">
                  {item.display_name}
                </p>
                <textarea
                  placeholder="เพิ่มคำอธิบาย (อย่างน้อย 100 ตัวอักษร เพื่อถือว่าครบถ้าไม่มีไฟล์)"
                  className="w-full border rounded-md p-2 text-sm"
                  rows={3}
                  value={editing[item.id] ?? ""}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, [item.id]: e.target.value }))
                  }
                />
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>ขั้นต่ำ 100 ตัวอักษร</span>
                  <span>{textLen}/100</span>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => handleSave(item.id)}
                    disabled={editing[item.id] === item.input_text}
                    className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    บันทึก
                  </button>
                </div>
              </div>

              {/* ขวา: ไฟล์ */}
              <div className="w-full md:w-1/6 flex flex-col md:items-end gap-2 mt-3 md:mt-0">
                <label className="text-sm cursor-pointer text-blue-600 flex items-center gap-1">
                  {item.file_key ? "🔁 เปลี่ยนไฟล์" : "📎 แนบไฟล์"}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(item, f);
                      e.currentTarget.value = ""; // reset input
                    }}
                  />
                </label>
                <div className="text-[11px] text-gray-500">
                  รองรับ .pdf .docx .jpg .png (≤10MB)
                </div>

                {item.file_key && (
                  <div className="text-xs text-right space-y-2">
                    <div
                      className="text-gray-600 truncate max-w-[220px]"
                      title={prettyFileName(item)}
                    >
                      📄 {prettyFileName(item)}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <a
                        href={item.file_path || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        🔍 ดูไฟล์แนบ
                      </a>
                      <button
                        onClick={() => handleFileDelete(item)}
                        className="text-red-600 hover:underline"
                        title="ลบไฟล์ออกจากระบบ"
                      >
                        🗑️ ลบไฟล์
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {!loading && filteredItems.length === 0 && (
          <div className="text-gray-500 text-sm">ไม่พบรายการตามตัวกรอง</div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* PRINT AREA (offscreen) */}
      <div ref={printRef} className="hidden">
        <div className="w-[794px] bg-white text-gray-900">
          {/* Header */}
          <div className="flex items-center gap-3 border-b px-6 py-4">
            {profile?.company_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.company_logo_url}
                alt="logo"
                className="h-10 w-10 object-contain"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-gray-200" />
            )}
            <div>
              <div className="font-bold">
                {profile?.company_name || "ชื่อบริษัท"} – OwnerOS
              </div>
              <div className="text-sm">
                Checklist หมวด {groupNo}: {groupName} • ปี {year}
              </div>
            </div>
            <div className="ml-auto text-sm text-gray-600">
              ออกรายงาน: {new Date().toLocaleString("th-TH")}
            </div>
          </div>

          {/* Summary */}
          <div className="px-6 py-3 text-sm">
            <div>
              ความคืบหน้า: <b>{stats.percent}%</b>
            </div>
            <div className="text-gray-600">
              ครบพร้อมไฟล์: {stats.withFile} • ครบยังไม่มีไฟล์: {stats.textOnly} • ยังไม่ทำ:{" "}
              {stats.pending}
            </div>
          </div>

          {/* Table header */}
          <div className="px-6">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold border-b py-2">
              <div className="col-span-1">#</div>
              <div className="col-span-4">หัวข้อ</div>
              <div className="col-span-2">สถานะ</div>
              <div className="col-span-3">หมายเหตุ</div>
              <div className="col-span-2">ไฟล์แนบ</div>
            </div>
          </div>

          {/* Rows */}
          <div className="px-6">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="grid grid-cols-12 gap-2 text-xs border-b py-2 break-words"
              >
                <div className="col-span-1">{idx + 1}</div>
                <div className="col-span-4">{it.display_name}</div>
                <div className="col-span-2">
                  {it.file_key
                    ? "ทำแล้ว (มีไฟล์)"
                    : (it.input_text?.trim().length || 0) >= 100
                    ? "ทำแล้ว (ไม่มีไฟล์)"
                    : "ยังไม่ทำ"}
                </div>
                <div className="col-span-3">
                  {truncate(it.input_text || "", 150)}
                </div>
                <div className="col-span-2">
                  {it.file_key ? prettyFileName(it) : "-"}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-6 text-xs text-gray-500">
            รายงานนี้สร้างอัตโนมัติด้วย OwnerOS
          </div>
        </div>
      </div>
    </div>
  );
}
