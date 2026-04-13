-- Create user_storage table to track storage usage and limits
CREATE TABLE public.user_storage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  storage_used BIGINT NOT NULL DEFAULT 0,
  storage_limit BIGINT NOT NULL DEFAULT 2147483648, -- 2GB in bytes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_storage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_storage
CREATE POLICY "Users can view their own storage"
  ON public.user_storage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own storage"
  ON public.user_storage
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own storage"
  ON public.user_storage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_storage_updated_at
  BEFORE UPDATE ON public.user_storage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create payment_plans table
CREATE TABLE public.payment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  storage_limit BIGINT NOT NULL,
  price_kes INTEGER NOT NULL,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for payment_plans (public read)
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment plans"
  ON public.payment_plans
  FOR SELECT
  USING (is_active = true);

-- Insert default payment plans
INSERT INTO public.payment_plans (name, storage_limit, price_kes, display_order) VALUES
  ('Plus', 10737418240, 500, 1),  -- 10GB
  ('Pro', 53687091200, 1200, 2),  -- 50GB
  ('Vision', 214748364800, 3000, 3); -- 200GB

-- Create user_payments table to track payment history
CREATE TABLE public.user_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.payment_plans(id),
  amount_kes INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  pesapal_tracking_id TEXT,
  pesapal_merchant_reference TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_payments
CREATE POLICY "Users can view their own payments"
  ON public.user_payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
  ON public.user_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_payments_updated_at
  BEFORE UPDATE ON public.user_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_user_storage_user_id ON public.user_storage(user_id);
CREATE INDEX idx_user_payments_user_id ON public.user_payments(user_id);
CREATE INDEX idx_user_payments_status ON public.user_payments(payment_status);

-- Function to calculate total storage used by a user
CREATE OR REPLACE FUNCTION public.calculate_user_storage(p_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_size BIGINT;
BEGIN
  SELECT COALESCE(SUM(file_size), 0)
  INTO total_size
  FROM public.media
  WHERE user_id = p_user_id;
  
  RETURN total_size;
END;
$$;

-- Function to update storage usage
CREATE OR REPLACE FUNCTION public.update_user_storage_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_storage BIGINT;
BEGIN
  -- Calculate total storage for the user
  total_storage := public.calculate_user_storage(COALESCE(NEW.user_id, OLD.user_id));
  
  -- Update or insert storage record
  INSERT INTO public.user_storage (user_id, storage_used)
  VALUES (COALESCE(NEW.user_id, OLD.user_id), total_storage)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    storage_used = total_storage,
    updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to automatically update storage when media is added/deleted
CREATE TRIGGER media_storage_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_storage_usage();