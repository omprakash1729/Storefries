# Storefries Listing — Implementation Plan

A web app that takes a Google Maps / Business Profile URL, fetches the business via Google Places API, persists it, and renders a clean SEO-friendly landing page.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind + shadcn (Lovable default)
- Backend: Lovable Cloud (Supabase) — Postgres + Edge Functions
- Google: Places API (New) via REST, called from Edge Function
- Map: Google Maps embed iframe (no JS API)
- Fonts: Montserrat via Google Fonts
- SEO: react-helmet-async + JSON-LD LocalBusiness schema

## Design System

Update `index.css` + `tailwind.config.ts` with semantic tokens:

- `--background: 0 0% 100%` (pure white, both modes — no dark mode toggle)
- `--brand-blue: 204 100% 39%` (#0073c8) → primary, headings, buttons
- `--brand-green: 99 68% 57%` (#6edb48) → accent only, never as text
- `--card-blue-tint`: `rgba(0,115,200,0.05)`
- `--card-green-tint`: `rgba(110,219,72,0.05)`
- `--gradient-cta`: `linear-gradient(135deg, #6edb48 0%, #0073c8 100%)` (buttons only)
- `--shadow-soft`: subtle elevation for cards
- Typography: Montserrat (400 body, 500–600 buttons, 600–700 headings)
- Strict rules enforced via tokens: no gradient backgrounds on sections, no green text, white-first.
- New shadcn Button variant: `cta` using the accent gradient.

## Database (Lovable Cloud)

Table `listings`:
- `id` uuid pk
- `slug` text unique (used in URL, e.g. `/l/joes-pizza-brooklyn`)
- `place_id` text unique
- `name`, `formatted_address`, `phone`, `website`, `category` text
- `rating` numeric, `user_ratings_total` int
- `lat`, `lng` numeric
- `opening_hours` jsonb
- `photos` jsonb (array of photo refs / proxied URLs)
- `reviews` jsonb (top 5)
- `editorial_summary` text
- `google_maps_url` text
- `raw` jsonb (full Places response for re-renders)
- `created_at`, `updated_at` timestamptz

RLS:
- Public SELECT (landing pages are public)
- INSERT/UPDATE only via service role (Edge Function)

## Edge Functions

1. **`generate-listing`** (POST `{ url }`)
   - Validates input with Zod
   - Resolves Place ID:
     - If URL contains `place_id=` → use directly
     - Else follow short links (`maps.app.goo.gl`, `goo.gl/maps`) via fetch with redirect, parse expanded URL, extract CID/coords/name, then call Places **Text Search** / **Find Place** to get `place_id`
   - Calls Places **Place Details (New)** with full field mask: name, address, phone, website, types, rating, userRatingCount, location, regularOpeningHours, photos, reviews, editorialSummary, googleMapsUri
   - Generates URL-safe `slug` (name + city, deduped)
   - Upserts into `listings` by `place_id`
   - Returns `{ slug }`

2. **`place-photo`** (GET `?name=places/.../photos/...&maxWidth=1200`)
   - Server-side proxy to Places photo media endpoint (keeps API key off client, returns image bytes)

Secret: `GOOGLE_PLACES_API_KEY` (requested via add_secret after plan approval).

## Frontend Routes

- `/` — Generator page
  - Hero: headline, single input (Google Maps URL), CTA button (gradient)
  - "How it works" 3-card row (light tinted cards)
  - On submit → calls `generate-listing` → navigates to `/l/:slug`
- `/l/:slug` — Generated landing page (SEO target)
- `/listings` — Browse all generated listings (simple grid)
- `*` — NotFound

## Landing Page Sections (`/l/:slug`)

All sections on white; only cards get tinted backgrounds.

1. **Hero** — Business name (blue h1), star rating + review count, address, CTA buttons (Call, Directions, Website) using gradient variant
2. **Image Gallery** — Rounded photo cards via `place-photo` proxy, responsive grid
3. **Business Details Card** — Light blue tint card; icons (lucide) + phone, website, category, hours
4. **Map Section** — Bordered white container with Google Maps embed iframe `https://www.google.com/maps/embed/v1/place?key=...&q=place_id:...` (uses same key; restrict in Cloud Console)
5. **Reviews** — Up to 5 review cards (light tinted), author, stars, relative time, text
6. **About** — Editorial summary or generated description, clean typography
7. **CTA** — White section, gradient buttons (Call now / Get directions)

### SEO per landing page

- `react-helmet-async` for title (`{name} — {city} | Storefries`), meta description, canonical, Open Graph
- JSON-LD `LocalBusiness` script with name, address, geo, telephone, openingHours, aggregateRating
- Semantic HTML: single `<h1>`, `<section>`, `<address>`, alt text on photos
- Slug-based clean URLs

## Component Structure

```
src/
  pages/
    Index.tsx            (generator)
    Listing.tsx          (/l/:slug)
    Listings.tsx         (browse)
    NotFound.tsx
  components/
    listing/
      Hero.tsx
      Gallery.tsx
      DetailsCard.tsx
      MapEmbed.tsx
      Reviews.tsx
      About.tsx
      CtaSection.tsx
      Seo.tsx            (helmet + JSON-LD)
    UrlGeneratorForm.tsx
  lib/
    supabase client (existing)
    slug.ts
  integrations/supabase/  (auto)
supabase/functions/
  generate-listing/index.ts
  place-photo/index.ts
```

## Build Order

1. Enable Lovable Cloud
2. Add `GOOGLE_PLACES_API_KEY` secret
3. Migration: `listings` table + RLS + indexes
4. Update design tokens (`index.css`, `tailwind.config.ts`), load Montserrat in `index.html`, add `cta` Button variant
5. Edge functions: `generate-listing`, `place-photo`
6. Generator page (`/`) + form + toast feedback
7. Listing page sections + SEO component
8. Listings browse page + routing
9. Polish: loading skeletons, empty states, error handling

## Notes on the credentials you shared

The `apps.googleusercontent.com` ID + `GOCSPX-…` secret are an **OAuth 2.0 client** (used for user sign-in flows), not a Places API key. After you approve this plan I'll prompt you to paste a **Places API key** from Google Cloud Console (enable "Places API (New)" + "Maps Embed API", restrict to HTTP referrers for the embed and to your edge function for the server key — or use one unrestricted key for now and lock it down later).
