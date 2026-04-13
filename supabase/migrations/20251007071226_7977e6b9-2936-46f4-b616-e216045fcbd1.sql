-- Create business_profiles table
CREATE TABLE public.business_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  business_name text,
  industry text,
  description text,
  services text,
  website text,
  facebook text,
  instagram text,
  twitter text,
  linkedin text,
  registration_number text,
  contact_email text,
  contact_phone text,
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for business_profiles
CREATE POLICY "Users can view their own business profile"
ON public.business_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business profile"
ON public.business_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profile"
ON public.business_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business profile"
ON public.business_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_business_profiles_updated_at
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();