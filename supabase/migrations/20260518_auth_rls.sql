-- Add user_id to listings table linking each generated landing page to its creator
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create leads table if it doesn't exist yet, with ownership tracking and link fields
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  google_maps_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure Row Level Security (RLS) is enabled on listings and leads
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- listings table policies
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
CREATE POLICY "Listings are viewable by everyone" 
  ON public.listings FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Listings are insertable by authenticated users" ON public.listings;
CREATE POLICY "Listings are insertable by authenticated users" 
  ON public.listings FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Listings are deletable by owner or admin" ON public.listings;
CREATE POLICY "Listings are deletable by owner or admin" 
  ON public.listings FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'prakash04082002@gmail.com');

DROP POLICY IF EXISTS "Listings are updatable by owner or admin" ON public.listings;
CREATE POLICY "Listings are updatable by owner or admin" 
  ON public.listings FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'prakash04082002@gmail.com')
  WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'prakash04082002@gmail.com');

-- leads table policies
DROP POLICY IF EXISTS "Leads are viewable by creator or admin" ON public.leads;
CREATE POLICY "Leads are viewable by creator or admin" 
  ON public.leads FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'prakash04082002@gmail.com');

DROP POLICY IF EXISTS "Leads are insertable by anyone" ON public.leads;
CREATE POLICY "Leads are insertable by anyone" 
  ON public.leads FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Leads are deletable by owner or admin" ON public.leads;
CREATE POLICY "Leads are deletable by owner or admin" 
  ON public.leads FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'prakash04082002@gmail.com');

DROP POLICY IF EXISTS "Leads are updatable by owner or admin" ON public.leads;
CREATE POLICY "Leads are updatable by owner or admin" 
  ON public.leads FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'prakash04082002@gmail.com')
  WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'prakash04082002@gmail.com');
