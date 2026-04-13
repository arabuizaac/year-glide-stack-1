-- Add is_published field to profiles for tracking published state
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- Create index for efficient querying of published public profiles
CREATE INDEX IF NOT EXISTS idx_profiles_published_public 
ON public.profiles(is_published, gallery_privacy) 
WHERE is_published = true AND gallery_privacy = 'public';

-- Update RLS policy for public profiles to include is_published check
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING ((gallery_privacy = 'public' AND is_published = true) OR (auth.uid() = user_id));

-- Update RLS policies for years to check is_published
DROP POLICY IF EXISTS "Public years are viewable by everyone" ON public.years;

CREATE POLICY "Public years are viewable by everyone" 
ON public.years 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles
  WHERE profiles.user_id = years.user_id 
  AND profiles.gallery_privacy = 'public'
  AND profiles.is_published = true
));

-- Update RLS policies for months
DROP POLICY IF EXISTS "Public months are viewable by everyone" ON public.months;

CREATE POLICY "Public months are viewable by everyone" 
ON public.months 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles
  WHERE profiles.user_id = months.user_id 
  AND profiles.gallery_privacy = 'public'
  AND profiles.is_published = true
));

-- Update RLS policies for galleries  
DROP POLICY IF EXISTS "Public galleries are viewable by everyone" ON public.galleries;

CREATE POLICY "Public galleries are viewable by everyone" 
ON public.galleries 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles
  WHERE profiles.user_id = galleries.user_id 
  AND profiles.gallery_privacy = 'public'
  AND profiles.is_published = true
));

-- Update RLS policies for media
DROP POLICY IF EXISTS "Public media are viewable by everyone" ON public.media;

CREATE POLICY "Public media are viewable by everyone" 
ON public.media 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles
  WHERE profiles.user_id = media.user_id 
  AND profiles.gallery_privacy = 'public'
  AND profiles.is_published = true
));

-- Update RLS policies for app_backgrounds
DROP POLICY IF EXISTS "Public app_backgrounds are viewable by everyone" ON public.app_backgrounds;

CREATE POLICY "Public app_backgrounds are viewable by everyone" 
ON public.app_backgrounds 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM profiles
  WHERE profiles.user_id = app_backgrounds.user_id 
  AND profiles.gallery_privacy = 'public'
  AND profiles.is_published = true
));