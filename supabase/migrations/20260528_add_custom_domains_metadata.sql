-- Add custom domain and listing url fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS desired_domain TEXT,
ADD COLUMN IF NOT EXISTS listing_url TEXT;
