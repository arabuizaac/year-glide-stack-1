-- Drop the constraint entirely since we have valid mixed data
ALTER TABLE public.media DROP CONSTRAINT IF EXISTS media_parent_type_check;