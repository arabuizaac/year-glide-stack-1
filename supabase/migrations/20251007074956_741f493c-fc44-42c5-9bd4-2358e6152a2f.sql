-- Add logo_url column to company_profile table
ALTER TABLE public.company_profile ADD COLUMN IF NOT EXISTS logo_url text;

-- Add comment
COMMENT ON COLUMN public.company_profile.logo_url IS 'URL to company logo stored in Supabase Storage';