-- Add read status field to contact_messages table
ALTER TABLE public.contact_messages 
ADD COLUMN read boolean NOT NULL DEFAULT false;

-- Add index for filtering by read status
CREATE INDEX idx_contact_messages_read ON public.contact_messages(read);

-- Update RLS policy for admins to update messages (mark as read/unread)
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
