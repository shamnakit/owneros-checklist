import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";

export interface RadarData {
  category: string;
  percentage: number;
}

export function useRadarScore(userId?: string) {
  const [data, setData] = useState<RadarData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchRadarData = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("vw_score_by_category")
        .select("category, percentage")
        .eq("user_id", userId);

      if (!error && rows) {
        setData(rows as RadarData[]);
      }

      setLoading(false);
    };

    fetchRadarData();
  }, [userId]);

  return { data, loading };
}
