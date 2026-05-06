import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { photoUrl } from "@/lib/photo";
import { Star, MapPin, Phone, Globe, Clock, Tag, Navigation, MessageCircle, ExternalLink } from "lucide-react";

interface Listing {
  id: string;
  slug: string;
  place_id: string;
  name: string;
  formatted_address: string | null;
  phone: string | null;
  website: string | null;
  category: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  lat: number | null;
  lng: number | null;
  opening_hours: any;
  photos: any;
  reviews: any;
  editorial_summary: string | null;
  google_maps_url: string | null;
}

const Stars = ({ value }: { value: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i <= Math.round(value) ? "fill-brand-blue text-brand-blue" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const ListingPage = () => {
  const { slug } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHoveringGallery, setIsHoveringGallery] = useState(false);
  const postsScrollRef = useRef<HTMLDivElement>(null);
  const [isHoveringPosts, setIsHoveringPosts] = useState(false);
  const [livePosts, setLivePosts] = useState<any[] | null>(null);
  const [liveTags, setLiveTags] = useState<string[] | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("listings")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setListing(data as Listing | null);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isHoveringGallery || !listing?.photos || listing.photos.length <= 1) return;

    let animationId: number;
    let lastTime = performance.now();

    const scroll = (time: number) => {
      // Throttle speed based on time delta for smooth animation regardless of refresh rate
      if (time - lastTime >= 16) { 
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0;
        } else {
          container.scrollLeft += 1;
        }
        lastTime = time;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, [isHoveringGallery, listing]);

  useEffect(() => {
    const container = postsScrollRef.current;
    if (!container || isHoveringPosts || !listing || (livePosts?.length || listing.posts?.length || 0) <= 1) return;

    let animationId: number;
    let lastTime = performance.now();

    const scroll = (time: number) => {
      if (time - lastTime >= 16) { 
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0;
        } else {
          container.scrollLeft += 1;
        }
        lastTime = time;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, [isHoveringPosts, listing, livePosts]);

  useEffect(() => {
    // Dynamically fetch tags and posts from SerpApi if the database doesn't have them yet
    const fetchLiveData = async () => {
      if (!listing?.name) return;
      try {
        const apiKey = import.meta.env.VITE_SERPAPI_KEY;
        if (!apiKey) {
          console.error("VITE_SERPAPI_KEY is missing in this environment!");
          return;
        }
        console.log("Fetching live data for:", listing.name);

        const query = encodeURIComponent(`${listing.name} ${listing.formatted_address || ""}`);
        const mapsUrl = `/api/serpapi/search.json?engine=google_maps&q=${query}&api_key=${apiKey}`;
        const mapsRes = await fetch(mapsUrl);
        
        if (!mapsRes.ok) {
          console.error("Maps API error:", mapsRes.status, await mapsRes.text());
          return;
        }
        
        const mapsJson = await mapsRes.json();
        
        const placeResult = mapsJson.local_results?.[0] || mapsJson.place_results;
        
        // Extract subcategories / tags
        if (placeResult?.type && Array.isArray(placeResult.type)) {
          setLiveTags(placeResult.type);
        }

        const dataId = placeResult?.data_id;
        if (!dataId) return;

        // Only fetch posts if they are missing from the DB
        if (!listing.posts || listing.posts.length === 0) {
          const postsUrl = `/api/serpapi/search.json?engine=google_maps_posts&data_id=${dataId}&api_key=${apiKey}`;
          const postsRes = await fetch(postsUrl);
          const postsJson = await postsRes.json();
          
          if (postsJson.posts && Array.isArray(postsJson.posts)) {
            const mapped = postsJson.posts.map((post: any) => ({
              title: post.title,
              content: post.description || post.snippet,
              photoUri: post.thumbnails?.[0] || post.thumbnail,
              publishTime: post.posted_at_text || post.date,
              callToAction: post.online_link ? {
                url: post.online_link || post.link,
                label: post.online_link_text || "Learn more"
              } : undefined
            }));
            setLivePosts(mapped);
          }
        }
      } catch (err) {
        console.error("Error fetching live data:", err);
      }
    };

    if (listing && (!liveTags || !listing.posts || listing.posts.length === 0)) {
      fetchLiveData();
    }
  }, [listing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 container py-20 text-center">
          <h1 className="text-3xl font-bold mb-3">Listing not found</h1>
          <Link to="/" className="text-brand-blue font-medium">Generate a new one →</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const photos = (listing.photos ?? []) as Array<{ name: string }>;
  const reviews = (listing.reviews ?? []) as Array<{
    authorAttribution?: { displayName?: string; photoUri?: string };
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
  }>;
  const dbPosts = (listing.posts ?? []) as Array<{
    title?: string;
    content?: string;
    photoUri?: string;
    publishTime?: string;
    callToAction?: { url?: string; label?: string };
  }>;
  const posts = livePosts || dbPosts;
  const hours = listing.opening_hours?.weekdayDescriptions as string[] | undefined;
  const heroPhoto = photos[0];

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.name,
    address: listing.formatted_address,
    telephone: listing.phone ?? undefined,
    url: listing.website ?? undefined,
    image: heroPhoto ? photoUrl(heroPhoto.name, 1600) : undefined,
    geo:
      listing.lat != null && listing.lng != null
        ? { "@type": "GeoCoordinates", latitude: listing.lat, longitude: listing.lng }
        : undefined,
    aggregateRating:
      listing.rating != null
        ? {
            "@type": "AggregateRating",
            ratingValue: listing.rating,
            reviewCount: listing.user_ratings_total ?? 0,
          }
        : undefined,
  };

  const mapsLink =
    listing.google_maps_url ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.formatted_address ?? listing.name)}&query_place_id=${listing.place_id}`;

  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    listing.formatted_address ?? listing.name,
  )}&output=embed`;

  // Format whatsapp link
  const whatsappLink = listing.phone ? `https://wa.me/${listing.phone.replace(/[^0-9]/g, "")}` : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title={`${listing.name}${listing.formatted_address ? " — " + listing.formatted_address.split(",")[1]?.trim() : ""} | Storefries`}
        description={
          listing.editorial_summary ??
          `${listing.name}${listing.category ? ` (${listing.category})` : ""}${listing.formatted_address ? " located at " + listing.formatted_address : ""}.`
        }
        image={heroPhoto ? photoUrl(heroPhoto.name, 1200) : undefined}
        jsonLd={jsonLd}
      />
      <SiteHeader />

      <main className="flex-1 w-full overflow-x-hidden">
        {/* Premium Hero Section */}
        <section className="relative w-full h-[40vh] min-h-[300px] md:h-[50vh] bg-muted">
          {heroPhoto ? (
            <img
              src={photoUrl(heroPhoto.name, 1600)}
              alt={listing.name}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-blue/20 to-brand-blue/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 w-full">
            <div className="container pb-6 md:pb-10">
              {listing.category && (
                <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold uppercase tracking-wider text-white bg-brand-blue/90 rounded-full backdrop-blur-sm">
                  {listing.category}
                </span>
              )}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 inline-block pb-1">
                {listing.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                {listing.rating != null && (
                  <div className="flex items-center gap-2 bg-background/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50">
                    <Stars value={listing.rating} />
                    <span className="font-semibold">{listing.rating}</span>
                    <span className="text-muted-foreground">({listing.user_ratings_total ?? 0} reviews)</span>
                  </div>
                )}
                {listing.formatted_address && (
                  <address className="not-italic flex items-center gap-1.5 text-foreground/90 bg-background/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-brand-blue" />
                    <span className="truncate max-w-[200px] sm:max-w-md">{listing.formatted_address}</span>
                  </address>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Navigation & Quick Actions */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
          <div className="container flex flex-col md:flex-row md:items-center justify-between py-3 gap-4">
            {/* Scroll Nav */}
            <nav className="flex overflow-x-auto hide-scrollbar gap-1 text-sm font-medium">
              <a href="#overview" className="whitespace-nowrap px-4 py-2 rounded-full hover:bg-secondary text-foreground transition-colors">Overview</a>
              <a href="#location" className="whitespace-nowrap px-4 py-2 rounded-full hover:bg-secondary text-foreground transition-colors">Location</a>
              {posts.length > 0 && (
                <a href="#posts" className="whitespace-nowrap px-4 py-2 rounded-full hover:bg-secondary text-foreground transition-colors">Updates</a>
              )}
              {reviews.length > 0 && (
                <a href="#reviews" className="whitespace-nowrap px-4 py-2 rounded-full hover:bg-secondary text-foreground transition-colors">Reviews</a>
              )}
              <Link to="/" className="whitespace-nowrap px-4 py-2 rounded-full hover:bg-secondary text-brand-blue transition-colors flex items-center gap-1">
                Find More Places <ExternalLink className="h-3 w-3" />
              </Link>
            </nav>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {listing.phone && (
                <Button asChild size="sm" className="rounded-full btn-gradient border-0 text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all">
                  <a href={`tel:${listing.phone}`}><Phone className="h-4 w-4 mr-2" /> Call</a>
                </Button>
              )}
              {whatsappLink && (
                <Button asChild size="sm" className="rounded-full btn-gradient border-0 text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all">
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp</a>
                </Button>
              )}
              <Button asChild size="sm" className="rounded-full btn-gradient border-0 text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all">
                <a href={mapsLink} target="_blank" rel="noopener noreferrer"><Navigation className="h-4 w-4 mr-2" /> Directions</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="container py-12 md:py-16 space-y-16 md:space-y-24">
          
          {/* Overview Section */}
          <section id="overview" className="scroll-mt-24">
            <div className="grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_350px] gap-8 items-start">
              {/* About Content */}
              <div className="space-y-6 min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold break-words">About {listing.name}</h2>
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed break-words">
                  {listing.editorial_summary ? (
                    <p>{listing.editorial_summary}</p>
                  ) : (
                    <p>{listing.name} is a local business{listing.category ? ` categorized under ${listing.category}` : ""}{listing.formatted_address ? `, located at ${listing.formatted_address}` : ""}.</p>
                  )}
                </div>

                {/* Inline Gallery */}
                {photos.length > 1 && (
                  <div className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Gallery</h3>
                    <div 
                      ref={scrollContainerRef}
                      onMouseEnter={() => setIsHoveringGallery(true)}
                      onMouseLeave={() => setIsHoveringGallery(false)}
                      className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar w-full"
                    >
                      {photos.slice(1, 10).map((p, i) => (
                         <div key={i} className="group relative flex-none w-[200px] h-[150px] md:w-[250px] md:h-[180px] rounded-xl overflow-hidden border border-border shadow-soft transition-all duration-500 hover:shadow-[0_0_25px_rgba(0,119,255,0.3)] hover:-translate-y-1 hover:border-brand-blue/50 cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/30 via-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                            <img src={photoUrl(p.name, 600)} alt={`${listing.name} ${i+2}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                         </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Card */}
              <div className="card-tint-blue rounded-2xl p-5 md:p-6 shadow-soft border border-border/50 sticky top-24 min-w-0 break-words">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-blue" /> 
                  Contact Info
                </h3>
                <div className="space-y-4">
                  {listing.formatted_address && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-semibold">Address</p>
                      <p className="text-sm font-medium leading-tight">{listing.formatted_address}</p>
                    </div>
                  )}
                  {listing.phone && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-semibold">Phone</p>
                      <a href={`tel:${listing.phone}`} className="text-sm font-medium text-brand-blue hover:underline">{listing.phone}</a>
                    </div>
                  )}
                  {listing.website && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-semibold">Website</p>
                      <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-blue hover:underline truncate block">
                        {listing.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  {hours && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-semibold flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Opening Hours
                      </p>
                      <ul className="space-y-1.5 text-xs">
                        {hours.map((d) => {
                          const [day, time] = d.split(": ");
                          return (
                            <li key={d} className="flex justify-between items-center">
                              <span className="font-medium text-muted-foreground">{day}</span>
                              <span className="text-foreground">{time}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section id="location" className="scroll-mt-24">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Location</h2>
            <div className="overflow-hidden rounded-3xl border border-border shadow-soft bg-background relative group">
              <iframe
                title={`Map of ${listing.name}`}
                src={embedSrc}
                className="w-full h-[350px] md:h-[450px] border-0 filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-[320px] bg-background/90 backdrop-blur-md p-4 rounded-2xl border border-border shadow-lg">
                 <h4 className="font-semibold text-sm mb-1">{listing.name}</h4>
                 <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{listing.formatted_address}</p>
                 <Button asChild className="w-full btn-gradient border-0 text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all" size="sm">
                   <a href={mapsLink} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
                 </Button>
              </div>
            </div>
          </section>

          {/* Posts / Updates Section */}
          {posts.length > 0 && (
            <div className="w-full bg-muted/30 py-16 my-16 border-y border-border">
              <section id="posts" className="container scroll-mt-24">
                <h2 className="text-xl md:text-2xl font-bold mb-1 text-foreground">
                  Latest Posts from {listing.name}
                </h2>
                {listing.formatted_address && (
                  <p className="text-sm font-medium text-foreground/80 mb-8">
                    in {listing.formatted_address.split(',').slice(-3, -2)[0]?.trim() || listing.formatted_address.split(',')[0]}
                  </p>
                )}
                
                <div className="relative group">
                  {/* Left Arrow */}
                  <button className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-border bg-background shadow-sm hidden md:flex items-center justify-center text-foreground hover:bg-secondary z-10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer" onClick={(e) => {
                    const container = e.currentTarget.nextElementSibling;
                    if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>

                  <div 
                    ref={postsScrollRef}
                    onMouseEnter={() => setIsHoveringPosts(true)}
                    onMouseLeave={() => setIsHoveringPosts(false)}
                    className="flex overflow-x-auto gap-4 hide-scrollbar w-full px-1 pb-4"
                  >
                    {posts.map((post, i) => (
                      <a 
                        key={i} 
                        href={post.callToAction?.url || mapsLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex-none w-[240px] md:w-[260px] group/post"
                      >
                        <article className="h-full bg-background border border-border shadow-sm rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                          <div className="h-[200px] w-full bg-muted overflow-hidden flex items-center justify-center relative">
                            {post.photoUri ? (
                              <img src={post.photoUri} alt={post.title || "Post image"} className="w-full h-full object-cover group-hover/post:scale-105 transition-transform duration-500" loading="lazy" />
                            ) : (
                              <div className="text-muted-foreground/30 flex flex-col items-center">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex-1 flex flex-col">
                            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-4 group-hover/post:text-brand-blue transition-colors">
                              {post.content || post.title}
                            </p>
                            <div className="mt-auto flex items-center justify-between">
                              {post.publishTime && (
                                <p className="text-[10px] text-muted-foreground font-medium">{post.publishTime}</p>
                              )}
                              <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider flex items-center gap-1 opacity-0 group-hover/post:opacity-100 transition-opacity">
                                {post.callToAction?.label || "View"} <ExternalLink className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </article>
                      </a>
                    ))}
                  </div>

                  {/* Right Arrow */}
                  <button className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-border bg-background shadow-sm hidden md:flex items-center justify-center text-foreground hover:bg-secondary z-10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer" onClick={(e) => {
                    const container = e.currentTarget.previousElementSibling;
                    if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <section id="reviews" className="scroll-mt-24 pt-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold uppercase tracking-widest mb-2">
                    <Star className="h-3.5 w-3.5 fill-brand-blue" />
                    Real Feedback
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Customer Reviews</h2>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center bg-background border border-border shadow-sm rounded-full px-4 py-1.5">
                      <span className="text-lg font-bold mr-2">{listing.rating}</span>
                      <Stars value={listing.rating ?? 0} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Based on <span className="text-foreground font-bold">{listing.user_ratings_total}</span> reviews</span>
                  </div>
                </div>
                <Button asChild className="w-full md:w-auto rounded-full btn-gradient border-0 text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all">
                   <a href={`https://search.google.com/local/writereview?placeid=${listing.place_id}`} target="_blank" rel="noopener noreferrer">Write a Review</a>
                </Button>
              </div>

              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {reviews.map((r, i) => (
                  <article key={i} className="group relative break-inside-avoid rounded-3xl bg-background border border-border shadow-soft p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-400 overflow-hidden">
                    {/* Decorative Quote Watermark */}
                    <span className="absolute -top-4 right-4 text-[100px] leading-none text-brand-blue/[0.03] font-serif select-none pointer-events-none transition-transform duration-500 group-hover:-translate-y-2 group-hover:text-brand-blue/[0.06]">
                      ”
                    </span>
                    
                    {/* Left Gradient Accent Line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-brand-blue to-brand-green opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                    
                    <div className="flex items-center gap-4 mb-5 relative z-10">
                      {r.authorAttribution?.photoUri ? (
                        <img
                          src={r.authorAttribution.photoUri}
                          alt={r.authorAttribution.displayName ?? "Reviewer"}
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 rounded-full object-cover ring-4 ring-muted/50 shadow-sm"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 flex items-center justify-center text-brand-blue font-bold text-lg ring-4 ring-muted/50 shadow-sm">
                           {(r.authorAttribution?.displayName ?? "A")[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate text-[15px]">{r.authorAttribution?.displayName ?? "Anonymous"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {r.rating != null && <Stars value={r.rating} />}
                          {r.relativePublishTimeDescription && (
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{r.relativePublishTimeDescription}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {r.text?.text && (
                      <p className="text-[15px] text-foreground/80 leading-relaxed relative z-10 italic">
                        "{r.text.text}"
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Category Tags */}
          {(listing.category || (liveTags && liveTags.length > 0)) && (
            <section id="category" className="scroll-mt-24 pb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Categories & Tags</h3>
              <div className="flex flex-wrap gap-2.5">
                {listing.category && (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-blue text-white shadow-md text-sm font-semibold border border-transparent hover:-translate-y-0.5 transition-transform cursor-default">
                    <Tag className="h-4 w-4" />
                    {listing.category}
                  </div>
                )}
                
                {liveTags && liveTags.filter(t => t.toLowerCase() !== listing.category?.toLowerCase()).map((tag, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-background text-sm font-medium border border-border shadow-soft hover:border-brand-blue/30 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default text-foreground/80">
                    {tag}
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

const Detail = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3">
    <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-brand-blue" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-semibold">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  </div>
);

export default ListingPage;
