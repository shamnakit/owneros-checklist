// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

type ChecklistItem = {
  id: number;
  name: string;
  is_done: boolean;
};

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลหลังได้ session
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return; // ออกจากฟังก์ชัน
      }

      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('user_id', user.id);

      if (error) console.error(error.message);
      else setItems(data ?? []);

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const toggle = async (id: number, done: boolean) => {
    const { error } = await supabase
      .from('checklists')
      .update({ is_done: !done })
      .eq('id', id);

    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_done: !done } : i))
      );
    }
  };

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Checklist ของคุณ</h1>
      {items.length === 0 ? (
        <p>ไม่มีรายการใน checklist</p>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i.id}>
              <input
                type="checkbox"
                checked={i.is_done}
                onChange={() => toggle(i.id, i.is_done)}
              />{' '}
              {i.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * ทำให้เพจเป็น SSR — รองรับพารามิเตอร์ใดๆ จาก Magic Link
 * ถ้าไม่อยากใช้ getServerSideProps สามารถลบได้ ไม่บังคับ
 */
export async function getServerSideProps() {
  return { props: {} };
}
