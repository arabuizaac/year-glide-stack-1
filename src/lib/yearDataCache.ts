import { supabase } from "@/integrations/supabase/client";

export interface CachedMonthData {
  id: string;
  name: string;
  background_type: string;
  background_value: string | null;
  display_order: number;
}

export interface CachedYearData {
  yearName: string;
  months: CachedMonthData[];
  background: { type: string; value: string | null } | null;
  fetchedAt: number;
}

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, CachedYearData>();
const pending = new Set<string>();

export const getCachedYearData = (yearId: string): CachedYearData | null => {
  const data = cache.get(yearId);
  if (!data) return null;
  if (Date.now() - data.fetchedAt > CACHE_TTL) {
    cache.delete(yearId);
    return null;
  }
  return data;
};

export const preloadYearData = async (yearId: string): Promise<CachedYearData | null> => {
  const existing = getCachedYearData(yearId);
  if (existing) return existing;
  if (pending.has(yearId)) return null;

  pending.add(yearId);
  try {
    const [yearRes, monthsRes] = await Promise.all([
      supabase
        .from("years")
        .select("name, background_type, background_value, user_id")
        .eq("id", yearId)
        .single(),
      supabase
        .from("months")
        .select("*")
        .eq("year_id", yearId)
        .order("display_order", { ascending: true }),
    ]);

    const yearData = yearRes.data;
    let background: { type: string; value: string | null } | null = null;

    if (yearData?.background_type && yearData?.background_value) {
      background = { type: yearData.background_type, value: yearData.background_value };
    } else if (yearData?.user_id) {
      const bgRes = await supabase
        .from("app_backgrounds")
        .select("background_type, background_value")
        .eq("user_id", yearData.user_id)
        .eq("is_active", true)
        .single();
      if (bgRes.data?.background_type && bgRes.data?.background_value) {
        background = { type: bgRes.data.background_type, value: bgRes.data.background_value };
      }
    }

    const entry: CachedYearData = {
      yearName: yearData?.name || "",
      months: (monthsRes.data || []) as CachedMonthData[],
      background,
      fetchedAt: Date.now(),
    };
    cache.set(yearId, entry);
    return entry;
  } catch {
    return null;
  } finally {
    pending.delete(yearId);
  }
};
