-- Update storage bucket to be public for easier access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'vision-swipe-media';

-- Create storage policies for vision-swipe-media bucket
CREATE POLICY "Allow authenticated users to upload media files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vision-swipe-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view media files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vision-swipe-media');

CREATE POLICY "Allow users to delete their own media files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'vision-swipe-media' AND auth.uid() IS NOT NULL);