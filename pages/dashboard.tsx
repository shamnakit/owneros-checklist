import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

type Item = { id:number; name:string; is_done:boolean; file_path:string|null };

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { data } = await supabase
        .from('checklists')
        .select('*')
        .eq('user_id', user.id);

      setItems(data ?? []);
      setLoading(false);
    })();
  }, [router]);

  const toggle = async (id:number, done:boolean) => {
    await supabase.from('checklists').update({ is_done:!done }).eq('id', id);
    setItems(p => p.map(i => i.id===id ? {...i,is_done:!done}:i));
  };

  const uploadFile = async (id:number) => {
    const fileInput = document.createElement('input');
    fileInput.type='file'; fileInput.accept='*/*';
    fileInput.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
      const { data:{ user } } = await supabase.auth.getUser(); if (!user) return;

      const path = `${user.id}/${id}/${file.name}`;
      const { error } = await supabase
        .storage.from('checklist-files').upload(path, file, { upsert:true });
      if (error) return alert(error.message);

      await supabase.from('checklists').update({ file_path:path }).eq('id', id);
      setItems(p => p.map(i => i.id===id ? {...i,file_path:path}:i));
    };
    fileInput.click();
  };

  if (loading) return <p style={{padding:40}}>Loading…</p>;

  const urlFor = (fp:string) =>
    supabase.storage.from('checklist-files').getPublicUrl(fp).data.publicUrl;

  return (
    <div style={{ padding: 40 }}>
      <h1>Checklist ของคุณ</h1>
      {items.length===0
        ? <p>ไม่มีรายการใน checklist</p>
        : <ul>{items.map(i=>(
            <li key={i.id} style={{marginBottom:8}}>
              <input type="checkbox" checked={i.is_done}
                     onChange={()=>toggle(i.id,i.is_done)} /> {i.name}{' '}
              {i.file_path
                ? <>
                    <a href={urlFor(i.file_path)} target="_blank">ดาวน์โหลดไฟล์</a>{' '}
                    <button onClick={()=>uploadFile(i.id)}>เปลี่ยนไฟล์</button>
                  </>
                : <button onClick={()=>uploadFile(i.id)}>Upload ไฟล์</button>}
            </li>
          ))}</ul>}
    </div>
  );
}
