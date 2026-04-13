-- Add RLS policies to allow public access to years for users with public gallery_privacy
CREATE POLICY "Public years are viewable by everyone"
ON public.years
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = years.user_id
    AND profiles.gallery_privacy = 'public'
  )
);

-- Add RLS policies to allow public access to months for users with public gallery_privacy
CREATE POLICY "Public months are viewable by everyone"
ON public.months
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = months.user_id
    AND profiles.gallery_privacy = 'public'
  )
);

-- Add RLS policies to allow public access to media for users with public gallery_privacy
CREATE POLICY "Public media are viewable by everyone"
ON public.media
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = media.user_id
    AND profiles.gallery_privacy = 'public'
  )
);

-- Add RLS policies to allow public access to galleries for users with public gallery_privacy
CREATE POLICY "Public galleries are viewable by everyone"
ON public.galleries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = galleries.user_id
    AND profiles.gallery_privacy = 'public'
  )
);

-- Add RLS policies to allow public access to app_backgrounds for users with public gallery_privacy
CREATE POLICY "Public app_backgrounds are viewable by everyone"
ON public.app_backgrounds
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = app_backgrounds.user_id
    AND profiles.gallery_privacy = 'public'
  )
);