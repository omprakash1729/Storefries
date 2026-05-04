CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  place_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  formatted_address TEXT,
  phone TEXT,
  website TEXT,
  category TEXT,
  rating NUMERIC,
  user_ratings_total INT,
  lat NUMERIC,
  lng NUMERIC,
  opening_hours JSONB,
  photos JSONB,
  reviews JSONB,
  editorial_summary TEXT,
  google_maps_url TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_slug ON public.listings(slug);
CREATE INDEX idx_listings_place_id ON public.listings(place_id);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings are viewable by everyone"
  ON public.listings FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();