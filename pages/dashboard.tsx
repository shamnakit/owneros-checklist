import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        const { data } = await supabase
          .from('checklists')
          .select('*')
          .eq('user_id', session.user.id);

        setItems(data ?? []);
        setLoading(false);
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/login');
      setSession(session);
    });

    return () => listener?.subscription.unsubscribe();
  }, [router]);

  const toggle = async (id, done) => {
    await supabase.from('checklists').update({ is_done: !done }).eq('id', id);
    setItems(p => p.map(i => i.id === id ? { ...i, is_done: !done } : i));
  };

  const uploadFile = async (id) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '*/*';
    fileInput.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0]; // ✅ correct
      if (!file || !session?.user) return;

      const path = `${session.user.id}/${id}/${file.name}`;
      const { error } = await supabase
        .storage.from('checklist-files').upload(path, file, { upsert: true });

      if (error) return alert(error.message);

      await supabase.from('checklists').update({ file_path: path }).eq('id', id);
      setItems(p => p.map(i => i.id === id ? { ...i, file_path: path } : i));
    };
    fileInput.click();
  };

  const urlFor = (fp) =>
    supabase.storage.from('checklist-files').getPublicUrl(fp).data.publicUrl;

  if (loading) return <div className="p-6">Loading...</div>;

  return (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-2">📋 OwnerOS Dashboard</h1>
    <p className="text-sm text-gray-600 mb-6">👤 ผู้ใช้งาน: {session?.user?.email}</p>

    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push('/login');
      }}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mb-4"
    >
      ออกจากระบบ
    </button>

    {items.length === 0 ? (
      <p>ไม่มีรายการใน checklist</p>
    ) : (
      <div className="space-y-8">
        {Object.entries(
          items.reduce((acc, item) => {
            const group = item.group_name || 'ไม่ระบุหมวด';
            if (!acc[group]) acc[group] = [];
            acc[group].push(item);
            return acc;
          }, {} as Record<string, typeof items>)
        ).map(([group, groupItems]) => (
          <section key={group}>
            <h2 className="text-xl font-semibold mb-2">{group}</h2>
            <ul className="space-y-2">
              {groupItems.map(i => (
                <li key={i.id}>
                  <input
                    type="checkbox"
                    checked={i.is_done}
                    onChange={() => toggle(i.id, i.is_done)}
                  />{' '}
                  {i.name}{' '}
                  {i.file_path ? (
                    <>
                      <a
                        href={urlFor(i.file_path)}
                        target="_blank"
                        rel="noopener"
                        className="text-blue-600 underline"
                      >
                        {i.file_path.split('/').pop()}
                      </a>{' '}
                      <button
                        onClick={() => uploadFile(i.id)}
                        className="ml-2 text-sm text-green-600 underline"
                      >
                        เปลี่ยนไฟล์
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => uploadFile(i.id)}
                      className="ml-2 text-sm text-blue-600 underline"
                    >
                      Upload ไฟล์
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    )}
  </div>
);

}