-- Create galleries table
CREATE TABLE IF NOT EXISTS public.galleries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  month_id UUID NOT NULL,
  user_id UUID NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT galleries_month_id_fkey FOREIGN KEY (month_id) REFERENCES public.months (id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

-- Create policies for galleries
CREATE POLICY "Users can view their own galleries" 
ON public.galleries 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own galleries" 
ON public.galleries 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own galleries" 
ON public.galleries 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own galleries" 
ON public.galleries 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_galleries_updated_at
BEFORE UPDATE ON public.galleries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_galleries_month_id ON public.galleries(month_id);
CREATE INDEX idx_galleries_user_id ON public.galleries(user_id);

-- Add a comment for clarity
COMMENT ON TABLE public.galleries IS 'Stores gallery information for organizing media within months';