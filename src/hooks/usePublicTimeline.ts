import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublicProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gallery_privacy: string | null;
  is_published: boolean | null;
  profile_type: string | null;
  occupation: string | null;
  location: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  facebook: string | null;
  tiktok: string | null;
}

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


// Demo timeline data for fallback when no public timelines exist
const DEMO_YEARS: Year[] = [
  {
    id: 'demo-2024',
    name: '2024',
    background_type: 'image',
    background_value: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=1000&fit=crop',
    display_order: 3,
    user_id: 'demo'
  },
  {
    id: 'demo-2023',
    name: '2023',
    background_type: 'image',
    background_value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1000&fit=crop',
    display_order: 2,
    user_id: 'demo'
  },
  {
    id: 'demo-2022',
    name: '2022',
    background_type: 'image',
    background_value: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=1000&fit=crop',
    display_order: 1,
    user_id: 'demo'
  }
];

const DEMO_PROFILE: PublicProfile = {
  id: 'demo',
  user_id: 'demo',
  username: 'visionswipe',
  display_name: 'VisionSwipe Demo',
  avatar_url: null,
  bio: 'Welcome to VisionSwipe! Create your own timeline by signing in.',
  gallery_privacy: 'public',
  is_published: true,
  profile_type: 'personal',
  occupation: null,
  location: 'San Francisco, USA',
  contact_email: 'hello@visionswipe.com',
  contact_phone: null,
  website: 'https://visionswipe.com',
  instagram: null,
  twitter: null,
  linkedin: null,
  facebook: null,
  tiktok: null,
};

export const usePublicTimeline = () => {
  const [years, setYears] = useState<Year[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [activeBackground, setActiveBackground] = useState<AppBackground | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchActiveBackgroundForUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('app_backgrounds')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) {
      setActiveBackground(data);
      return data;
    }
    return null;
  }, []);


  const fetchRandomPublicTimeline = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Get all published public profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('gallery_privacy', 'public')
        .eq('is_published', true);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        useDemoTimeline();
        return;
      }

      if (!profiles || profiles.length === 0) {
        console.log('No published public profiles found, using demo');
        useDemoTimeline();
        return;
      }

      // Get profiles that have years
      const profilesWithYears: PublicProfile[] = [];
      
      for (const profile of profiles) {
        const { data: yearData, error: yearError } = await supabase
          .from('years')
          .select('id')
          .eq('user_id', profile.user_id)
          .limit(1);

        if (!yearError && yearData && yearData.length > 0) {
          profilesWithYears.push(profile as PublicProfile);
        }
      }

      if (profilesWithYears.length === 0) {
        console.log('No profiles with years found, using demo');
        useDemoTimeline();
        return;
      }

      // Select a random profile with years
      const randomIndex = Math.floor(Math.random() * profilesWithYears.length);
      const randomProfile = profilesWithYears[randomIndex];
      
      // Fetch years for the selected profile
      const { data: yearsData, error: yearsError } = await supabase
        .from('years')
        .select('*')
        .eq('user_id', randomProfile.user_id)
        .order('display_order', { ascending: true });

      if (yearsError || !yearsData || yearsData.length === 0) {
        useDemoTimeline();
        return;
      }

      // Fetch active background for the selected profile
      await fetchActiveBackgroundForUser(randomProfile.user_id);

      setSelectedProfile(randomProfile);
      setYears(yearsData);
      setIsDemo(false);
    } catch (error) {
      console.error('Error in fetchRandomPublicTimeline:', error);
      useDemoTimeline();
    } finally {
      setIsLoading(false);
    }
  }, [fetchActiveBackgroundForUser]);

  const useDemoTimeline = useCallback(() => {
    setSelectedProfile(DEMO_PROFILE);
    setYears(DEMO_YEARS);
    setActiveBackground(null);
    setIsDemo(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRandomPublicTimeline();
  }, []);

  return {
    years,
    selectedProfile,
    activeBackground,
    isLoading,
    isDemo,
    refetch: fetchRandomPublicTimeline
  };
};
