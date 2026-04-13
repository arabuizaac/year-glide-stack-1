-- Add recipient_user_id column to associate messages with gallery owners
ALTER TABLE public.contact_messages 
ADD COLUMN recipient_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to allow gallery owners to manage their messages
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;

-- Recipients can view their own messages
CREATE POLICY "Recipients can view their messages" 
ON public.contact_messages 
FOR SELECT 
USING (auth.uid() = recipient_user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Recipients can update their own messages (mark as read)
CREATE POLICY "Recipients can update their messages" 
ON public.contact_messages 
FOR UPDATE 
USING (auth.uid() = recipient_user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Recipients can delete their own messages
CREATE POLICY "Recipients can delete their messages" 
ON public.contact_messages 
FOR DELETE 
USING (auth.uid() = recipient_user_id OR has_role(auth.uid(), 'admin'::app_role));