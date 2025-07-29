// src/hooks/useUser.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (!error) setProfile(data);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  return { user, profile, loading };
}
