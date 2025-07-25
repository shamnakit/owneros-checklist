
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ChecklistItem = {
  id: number;
  name: string;
  is_done: boolean;
};

export default function Dashboard() {
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('user_id', user.id);

      if (data) setChecklists(data);
      if (error) alert(error.message);
    };

    getUserAndData();
  }, []);

  const toggleChecklist = async (id: number, is_done: boolean) => {
    const { error } = await supabase
      .from('checklists')
      .update({ is_done: !is_done })
      .eq('id', id);

    if (!error) {
      setChecklists(prev =>
        prev.map(item =>
          item.id === id ? { ...item, is_done: !is_done } : item
        )
      );
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Checklist ของคุณ</h1>
      {checklists.length === 0 ? (
        <p>ไม่มีรายการใน checklist</p>
      ) : (
        <ul>
          {checklists.map(item => (
            <li key={item.id}>
              <input
                type="checkbox"
                checked={item.is_done}
                onChange={() => toggleChecklist(item.id, item.is_done)}
              />
              {' '}
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
