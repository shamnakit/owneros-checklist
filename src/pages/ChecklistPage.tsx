// ChecklistPage.tsx (เพิ่มระบบสรุป Progress % ความคืบหน้า)

import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
  file_path?: string;
}

export default function ChecklistPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [warnings, setWarnings] = useState<Record<string, boolean>>({});
  const [newItemName, setNewItemName] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from('checklists').select('*').eq('user_id', user.id);
      if (data) {
        setItems(data);
        const warn: Record<string, boolean> = {};
        data.forEach((item) => {
          warn[item.id] = item.checked && !item.file_path;
        });
        setWarnings(warn);
      }
    };
    load();
  }, []);

  const updateCheck = async (item: ChecklistItem) => {
    const updated = !item.checked;
    await supabase.from('checklists').update({ checked: updated }).eq('id', item.id);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: updated } : i))
    );
    setWarnings((prev) => ({
      ...prev,
      [item.id]: updated && !item.file_path,
    }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, item: ChecklistItem) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    const ext = file.name.split('.').pop();
    const filename = `${userId}/${item.name}-${uuidv4()}.${ext}`;

    const { error } = await supabase.storage.from('checklist-files').upload(filename, file);
    if (error) return alert('Upload failed: ' + error.message);

    await supabase.from('checklists').update({ file_path: filename }).eq('id', item.id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, file_path: filename } : i
      )
    );
    setWarnings((prev) => ({
      ...prev,
      [item.id]: false,
    }));
  };

  const getFileName = (path: string | undefined) => {
    if (!path) return '';
    const parts = path.split('/');
    return parts.length > 1 ? parts[1] : path;
  };

  const getPublicUrl = (path: string | undefined) => {
    if (!path) return '#';
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/checklist-files/${path}`;
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !userId) return;
    const { data, error } = await supabase
      .from('checklists')
      .insert([{ user_id: userId, name: newItemName.trim(), checked: false }])
      .select()
      .single();
    if (error) return alert('เพิ่ม Checklist ไม่สำเร็จ: ' + error.message);
    setItems([...items, data]);
    setNewItemName('');
  };

  const total = items.length;
  const done = items.filter((item) => item.checked).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Checklist ระบบองค์กร</h1>
      <p className="text-slate-600 mb-6">ความคืบหน้า: <strong>{progress}%</strong> ({done}/{total})</p>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="เพิ่ม Checklist ใหม่..."
          className="border p-2 rounded flex-1"
        />
        <button
          onClick={handleAddItem}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ➕ เพิ่ม
        </button>
      </div>

      {items.map((item) => (
        <div key={item.id} className="mb-4 border-b pb-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => updateCheck(item)}
              className="accent-green-600"
            />
            <span>{item.name}</span>
          </label>
          <div className="flex items-center gap-3 mt-1">
            <input type="file" onChange={(e) => handleUpload(e, item)} accept=".pdf,.jpg,.png,.doc,.docx" />
            {item.file_path && (
              <a
                href={getPublicUrl(item.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline"
              >
                📎 {getFileName(item.file_path)}
              </a>
            )}
            {warnings[item.id] && <span className="text-yellow-600 text-sm">⚠ ควรแนบไฟล์</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
