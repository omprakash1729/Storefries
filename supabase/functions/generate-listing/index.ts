// @ts-nocheck
// Generate or fetch a listing from a Google Maps URL
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLACES_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function expandShortUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    return res.url || url;
  } catch {
    return url;
  }
}

function extractPlaceIdFromUrl(url: string): string | null {
  // ?place_id=ChIJ...
  const placeIdMatch = url.match(/[?&!]place_id=([A-Za-z0-9_-]+)/);
  if (placeIdMatch) return placeIdMatch[1];
  // !1s0x...:0x... is hex IDs (CID), not a place_id we can use directly
  return null;
}

function extractQueryFromUrl(url: string): { query?: string; lat?: number; lng?: number } {
  // /place/<NAME>/@lat,lng,
  const placeMatch = url.match(/\/place\/([^/]+)/);
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  let query: string | undefined;
  if (placeMatch) {
    query = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
  } else {
    // Fallback: extract from 'q=' query parameter
    try {
      const parsedUrl = new URL(url);
      const qParam = parsedUrl.searchParams.get("q");
      if (qParam) {
        query = qParam;
      }
    } catch {
      // If URL parsing fails, try matching regex
      const qMatch = url.match(/[?&]q=([^&]+)/);
      if (qMatch) {
        query = decodeURIComponent(qMatch[1].replace(/\+/g, " "));
      }
    }
  }
  let lat: number | undefined, lng: number | undefined;
  if (atMatch) {
    lat = parseFloat(atMatch[1]);
    lng = parseFloat(atMatch[2]);
  }
  return { query, lat, lng };
}

async function findPlaceId(query: string, lat?: number, lng?: number): Promise<string | null> {
  const body: any = { textQuery: query };
  if (lat != null && lng != null) {
    body.locationBias = {
      circle: { center: { latitude: lat, longitude: lng }, radius: 500 },
    };
  }
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error("searchText error", json);
    return null;
  }
  return json.places?.[0]?.id ?? null;
}

async function getPlaceDetails(placeId: string) {
  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "addressComponents",
    "internationalPhoneNumber",
    "nationalPhoneNumber",
    "websiteUri",
    "googleMapsUri",
    "primaryTypeDisplayName",
    "types",
    "rating",
    "userRatingCount",
    "location",
    "regularOpeningHours",
    "photos",
    "reviews",
    "editorialSummary",
  ].join(",");

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Place Details error: ${JSON.stringify(json)}`);
  }
  return json;
}

async function fetchGmbData(name: string, address: string) {
  try {
    const query = encodeURIComponent(`${name} ${address}`);
    const mapsRes = await fetch(`https://serpapi.com/search.json?engine=google_maps&q=${query}&api_key=${SERPAPI_KEY}`);
    const mapsJson = await mapsRes.json();
    const local = mapsJson.local_results?.[0] || mapsJson.place_results;
    const dataId = local?.data_id;
    const type = local?.type && Array.isArray(local.type) && local.type.length > 0 ? local.type[0] : null;
    
    if (!dataId) return { posts: [], type };

    const postsRes = await fetch(`https://serpapi.com/search.json?engine=google_maps_posts&data_id=${dataId}&api_key=${SERPAPI_KEY}`);
    const postsJson = await postsRes.json();
    
    if (!postsJson.posts || !Array.isArray(postsJson.posts)) return { posts: [], type };
    
    const posts = postsJson.posts.map((post: any) => ({
      title: post.title,
      content: post.description || post.snippet,
      photoUri: post.thumbnails?.[0] || post.thumbnail || post.thumbnail_url || post.image_url || post.media?.[0]?.thumbnail || post.media?.[0]?.url || post.images?.[0] || null,
      publishTime: post.posted_at_text || post.date,
      callToAction: post.online_link ? {
        url: post.online_link || post.link,
        label: post.online_link_text || "Learn more"
      } : undefined
    }));
    
    return { posts, type };
  } catch (error) {
    console.error("Error fetching GMB data:", error);
    return { posts: [], type: null };
  }
}

async function generateSeoDescription(
  name: string,
  category: string | null,
  address: string | null,
  googleSummary: string | null,
  reviews: any[] | null,
  posts: any[] | null
): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY is not defined.");
    return null;
  }
  try {
    const fallbackText = `${name} is a local business${category ? ` categorized under ${category}` : ""}${address ? `, located at ${address}` : ""}.`;
    let prompt = `Write an engaging, professional, and SEO-friendly "About Us" description for a local business.
Here is the retrieved information about this business:
Business Name: ${name}
Category: ${category || "Local Business"}
Address: ${address || "Not Specified"}
`;

    if (googleSummary) {
      prompt += `Google's Short Summary: ${googleSummary}\n`;
    }

    if (reviews && Array.isArray(reviews) && reviews.length > 0) {
      const reviewSnippets = reviews
        .slice(0, 3)
        .map((r: any) => r.text?.text)
        .filter(Boolean)
        .join(" | ");
      if (reviewSnippets) {
        prompt += `Customer Reviews Highlights: ${reviewSnippets}\n`;
      }
    }

    if (posts && Array.isArray(posts) && posts.length > 0) {
      const postSnippets = posts
        .slice(0, 2)
        .map((p: any) => p.content || p.title)
        .filter(Boolean)
        .join(" | ");
      if (postSnippets) {
        prompt += `Recent Updates/Posts: ${postSnippets}\n`;
      }
    }

    prompt += `
Basic Description: ${fallbackText}

Instructions:
- The description MUST contain exactly 700 to 750 characters when spaces are excluded (count only non-space characters). This is a hard requirement — do not exceed 750 or go below 700 non-space characters.
- DO NOT use em dashes (— or ) under ANY circumstances. Replace with commas, semicolons, or parentheses.
- DO NOT include any website URLs or links in the description.
- Optimize the content with relevant local SEO keywords, naturally integrating the business name, category, services/products, and city/neighborhood/location.
- Synthesize all the provided info (reviews, posts, short summary) into a cohesive, professional, welcoming, and trust-building about section. Do not list them raw.
- Output ONLY the generated description. Do not include any quotes, greetings, introductory text, or formatting.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert SEO copywriter specializing in local businesses." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("OpenAI API error:", json);
      return null;
    }
    let description = (json.choices?.[0]?.message?.content ?? "").trim();
    if (!description) return null;

    // Post-process: strip em dashes (—, –, --)
    description = description.replace(/\u2014|\u2013|--/g, ",");

    // Post-process: remove any URLs accidentally included
    description = description.replace(/https?:\/\/\S+/g, "").replace(/\s{2,}/g, " ").trim();

    // Post-process: enforce 700-750 non-space char limit by trimming at sentence boundary
    const nonSpaceCount = (s: string) => s.replace(/ /g, "").length;
    if (nonSpaceCount(description) > 750) {
      // Trim to last sentence ending that keeps us within the limit
      const sentences = description.match(/[^.!?]+[.!?]+/g) || [description];
      let trimmed = "";
      for (const sentence of sentences) {
        const candidate = (trimmed + " " + sentence).trim();
        if (nonSpaceCount(candidate) <= 750) {
          trimmed = candidate;
        } else {
          break;
        }
      }
      description = trimmed || description.slice(0, 900); // hard fallback
    }

    return description || null;
  } catch (error) {
    console.error("Error generating SEO description with OpenAI:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!PLACES_KEY) throw new Error("GOOGLE_PLACES_API_KEY missing");

    const { url, userId, slug: requestedSlug } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Direct Claim via Slug (fast path)
    if (requestedSlug && userId) {
      console.log(`Checking direct claim for slug: ${requestedSlug} and user: ${userId}`);
      const { data: existingSlug } = await supabase
        .from("listings")
        .select("slug, user_id")
        .eq("slug", requestedSlug)
        .maybeSingle();

      if (existingSlug) {
        if (!existingSlug.user_id) {
          console.log(`Claiming listing ${requestedSlug} for user ${userId}`);
          await supabase
            .from("listings")
            .update({ user_id: userId })
            .eq("slug", requestedSlug);
        }
        return new Response(JSON.stringify({ slug: existingSlug.slug, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let workingUrl = url.trim();
    if (/maps\.app\.goo\.gl|goo\.gl\/maps|share\.google/.test(workingUrl)) {
      workingUrl = await expandShortUrl(workingUrl);
    }

    // 2. Direct Claim via CID match in URL
    if (workingUrl.includes("cid=") && userId) {
      const cidMatch = workingUrl.match(/[?&]cid=(\d+)/);
      if (cidMatch) {
        const cid = cidMatch[1];
        console.log(`Searching listing by CID: ${cid}`);
        const { data: existingCid } = await supabase
          .from("listings")
          .select("slug, user_id")
          .like("google_maps_url", `%cid=${cid}%`)
          .maybeSingle();

        if (existingCid) {
          if (!existingCid.user_id) {
            console.log(`Claiming listing ${existingCid.slug} for user ${userId} via CID search`);
            await supabase
              .from("listings")
              .update({ user_id: userId })
              .eq("slug", existingCid.slug);
          }
          return new Response(JSON.stringify({ slug: existingCid.slug, cached: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    let placeId = extractPlaceIdFromUrl(workingUrl);

    if (!placeId) {
      const { query, lat, lng } = extractQueryFromUrl(workingUrl);
      if (!query) {
        return new Response(
          JSON.stringify({ error: "Could not extract business info from URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      placeId = await findPlaceId(query, lat, lng);
    }

    if (!placeId) {
      return new Response(JSON.stringify({ error: "Place not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return existing if present
    const { data: existing } = await supabase
      .from("listings")
      .select("slug, user_id")
      .eq("place_id", placeId)
      .maybeSingle();

    if (existing) {
      if (!existing.user_id && userId) {
        console.log(`Claiming unclaimed listing ${existing.slug} for user ${userId}`);
        await supabase
          .from("listings")
          .update({ user_id: userId })
          .eq("place_id", placeId);
      }
      return new Response(JSON.stringify({ slug: existing.slug, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const details = await getPlaceDetails(placeId);

    const name = details.displayName?.text ?? "Business";
    const city =
      details.addressComponents?.find((c: any) =>
        c.types?.includes("locality"),
      )?.shortText ?? "";

    let baseSlug = slugify(`${name}-${city}`);
    if (!baseSlug) baseSlug = slugify(name) || "listing";
    let slug = baseSlug;
    let n = 1;
    // ensure unique
    while (true) {
      const { data: clash } = await supabase
        .from("listings")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!clash) break;
      n += 1;
      slug = `${baseSlug}-${n}`;
    }

    const gmbData = await fetchGmbData(name, details.formattedAddress || "");
    const category = gmbData.type || details.primaryTypeDisplayName?.text || details.types?.[0] || null;

    console.log(`Generating OpenAI description for: ${name}`);
    const editorial_summary = await generateSeoDescription(
      name,
      category,
      details.formattedAddress ?? null,
      details.editorialSummary?.text ?? null,
      details.reviews ?? null,
      gmbData.posts ?? null
    ) || details.editorialSummary?.text || null;

    const row = {
      slug,
      place_id: placeId,
      name,
      formatted_address: details.formattedAddress ?? null,
      phone: details.internationalPhoneNumber ?? details.nationalPhoneNumber ?? null,
      website: details.websiteUri ?? null,
      category,
      rating: details.rating ?? null,
      user_ratings_total: details.userRatingCount ?? null,
      lat: details.location?.latitude ?? null,
      lng: details.location?.longitude ?? null,
      opening_hours: details.regularOpeningHours ?? null,
      photos: details.photos ?? null,
      reviews: details.reviews ?? null,
      editorial_summary,
      google_maps_url: details.googleMapsUri ?? null,
      raw: details,
      posts: gmbData.posts,
      user_id: userId || null,
    };

    const { error: insertErr } = await supabase.from("listings").insert(row);
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ slug, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
