// Proxy Google Places photo media so the API key stays server-side.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLACES_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name"); // e.g. places/XXX/photos/YYY
    const maxWidth = url.searchParams.get("w") ?? "1200";
    const maxHeight = url.searchParams.get("h");

    if (!name) {
      return new Response("Missing name", { status: 400, headers: corsHeaders });
    }

    const params = new URLSearchParams({ key: PLACES_KEY, maxWidthPx: maxWidth });
    if (maxHeight) params.set("maxHeightPx", maxHeight);

    const upstream = `https://places.googleapis.com/v1/${name}/media?${params.toString()}`;
    const res = await fetch(upstream, { redirect: "follow" });

    if (!res.ok) {
      const text = await res.text();
      return new Response(text, { status: res.status, headers: corsHeaders });
    }

    return new Response(res.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return new Response(String(e), { status: 500, headers: corsHeaders });
  }
});
