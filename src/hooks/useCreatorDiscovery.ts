import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PublicProfile } from "./usePublicTimeline";

interface Year {
  id: string;
  name: string;
  background_type: string | null;
  background_value: string | null;
  display_order: number | null;
  user_id: string;
}

interface AppBackground {
  id: string;
  background_type: string;
  background_value: string | null;
  is_active: boolean;
}

interface CreatorTimeline {
  profile: PublicProfile;
  years: Year[];
  activeBackground: AppBackground | null;
}

const DEMO_PROFILE: PublicProfile = {
  id: "demo",
  user_id: "demo",
  username: "visionswipe",
  display_name: "VisionSwipe Demo",
  avatar_url: null,
  bio: "Welcome to VisionSwipe! Create your own timeline by signing in.",
  gallery_privacy: "public",
  is_published: true,
  profile_type: "personal",
  occupation: null,
  location: "San Francisco, USA",
  contact_email: "hello@visionswipe.com",
  contact_phone: null,
  website: "https://visionswipe.com",
  instagram: null,
  twitter: null,
  linkedin: null,
  facebook: null,
  tiktok: null,
};

const DEMO_YEARS: Year[] = [
  {
    id: "demo-2024",
    name: "2024",
    background_type: "image",
    background_value:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=1000&fit=crop",
    display_order: 3,
    user_id: "demo",
  },
  {
    id: "demo-2023",
    name: "2023",
    background_type: "image",
    background_value:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1000&fit=crop",
    display_order: 2,
    user_id: "demo",
  },
  {
    id: "demo-2022",
    name: "2022",
    background_type: "image",
    background_value:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=1000&fit=crop",
    display_order: 1,
    user_id: "demo",
  },
];

// ─── Module-level helpers (usable outside React) ──────────────────────────
/** Pre-select a creator by userId so that the next Index mount starts on them. */
export function jumpToCreatorByUserId(userId: string): boolean {
  if (!_moduleState) return false;
  const idx = _moduleState.creators.findIndex(c => c.profile.user_id === userId);
  if (idx < 0) return false;
  _moduleState.currentCreatorIndex = idx;
  return true;
}

// ─── Module-level singleton ────────────────────────────────────────────────
// Persists across React route unmounts so navigating back restores exact state.
interface ModuleState {
  creators: CreatorTimeline[];
  currentCreatorIndex: number;
  isDemo: boolean;
  fetchedAt: number;
}

const STATE_TTL = 30 * 60 * 1000; // 30 minutes
let _moduleState: ModuleState | null = null;

const getModuleState = (): ModuleState | null => {
  if (!_moduleState) return null;
  if (Date.now() - _moduleState.fetchedAt > STATE_TTL) {
    _moduleState = null;
    return null;
  }
  return _moduleState;
};
// ──────────────────────────────────────────────────────────────────────────

export const useCreatorDiscovery = () => {
  const saved = getModuleState();

  const [creators, setCreators] = useState<CreatorTimeline[]>(saved?.creators || []);
  const [currentCreatorIndex, setCurrentCreatorIndex] = useState(saved?.currentCreatorIndex || 0);
  const [isLoading, setIsLoading] = useState(!saved);
  const [isDemo, setIsDemo] = useState(saved?.isDemo || false);
  const preloadedRef = useRef<Set<number>>(new Set(saved ? [saved.currentCreatorIndex] : []));

  // Keep module state in sync whenever creators or index change
  useEffect(() => {
    if (creators.length > 0) {
      _moduleState = {
        creators,
        currentCreatorIndex,
        isDemo,
        fetchedAt: _moduleState?.fetchedAt || Date.now(),
      };
    }
  }, [creators, currentCreatorIndex, isDemo]);

  const loadCreatorData = async (
    profile: PublicProfile
  ): Promise<CreatorTimeline> => {
    const [{ data: years }, { data: bg }] = await Promise.all([
      supabase
        .from("years")
        .select("*")
        .eq("user_id", profile.user_id)
        .order("display_order", { ascending: true }),
      supabase
        .from("app_backgrounds")
        .select("*")
        .eq("user_id", profile.user_id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

    return {
      profile,
      years: years || [],
      activeBackground: bg || null,
    };
  };

  const preloadCreator = async (
    profile: PublicProfile,
    index: number,
  ) => {
    if (preloadedRef.current.has(index)) return;
    preloadedRef.current.add(index);
    const data = await loadCreatorData(profile);
    setCreators((prev) => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  };

  // Load all public creator profiles (skipped if module cache is fresh)
  const fetchAllCreators = useCallback(async () => {
    if (getModuleState()) return; // already have fresh data
    setIsLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("gallery_privacy", "public")
        .eq("is_published", true);

      if (error || !profiles || profiles.length === 0) {
        const demo = [{ profile: DEMO_PROFILE, years: DEMO_YEARS, activeBackground: null }];
        setCreators(demo);
        setIsDemo(true);
        setIsLoading(false);
        return;
      }

      // Check which profiles have years
      const validProfiles: PublicProfile[] = [];
      for (const p of profiles) {
        const { data: y } = await supabase
          .from("years")
          .select("id")
          .eq("user_id", p.user_id)
          .limit(1);
        if (y && y.length > 0) validProfiles.push(p as PublicProfile);
      }

      if (validProfiles.length === 0) {
        const demo = [{ profile: DEMO_PROFILE, years: DEMO_YEARS, activeBackground: null }];
        setCreators(demo);
        setIsDemo(true);
        setIsLoading(false);
        return;
      }

      const shuffled = validProfiles.sort(() => Math.random() - 0.5);

      const first = await loadCreatorData(shuffled[0]);
      const entries: CreatorTimeline[] = shuffled.map((p, i) =>
        i === 0 ? first : { profile: p, years: [], activeBackground: null }
      );

      setCreators(entries);
      setCurrentCreatorIndex(0);
      setIsDemo(false);
      preloadedRef.current = new Set([0]);

      // Preload next creator
      if (shuffled.length > 1) {
        preloadCreator(shuffled[1], 1);
      }
    } catch (err) {
      console.error("Creator discovery error:", err);
      const demo = [{ profile: DEMO_PROFILE, years: DEMO_YEARS, activeBackground: null }];
      setCreators(demo);
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const goToCreator = useCallback(
    async (direction: "up" | "down") => {
      const nextIndex =
        direction === "up"
          ? Math.min(currentCreatorIndex + 1, creators.length - 1)
          : Math.max(currentCreatorIndex - 1, 0);

      if (nextIndex === currentCreatorIndex) return false;

      // Ensure target creator's data is loaded
      if (creators[nextIndex].years.length === 0) {
        const data = await loadCreatorData(creators[nextIndex].profile);
        setCreators((prev) => {
          const updated = [...prev];
          updated[nextIndex] = data;
          return updated;
        });
      }

      setCurrentCreatorIndex(nextIndex);

      // Preload neighbors
      const preloadTargets = [nextIndex - 1, nextIndex + 1].filter(
        (i) => i >= 0 && i < creators.length && !preloadedRef.current.has(i)
      );
      for (const t of preloadTargets) {
        preloadCreator(creators[t].profile, t);
      }

      return true;
    },
    [currentCreatorIndex, creators]
  );

  useEffect(() => {
    fetchAllCreators();
  }, []);

  const current = creators[currentCreatorIndex] || null;

  return {
    creators,
    currentCreatorIndex,
    currentCreator: current,
    years: current?.years || [],
    selectedProfile: current?.profile || null,
    activeBackground: current?.activeBackground || null,
    isLoading,
    isDemo,
    goToCreator,
    totalCreators: creators.length,
  };
};
