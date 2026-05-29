import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { photoUrl } from "@/lib/photo";
import { getBestCategory } from "@/lib/utils";
import { toast } from "sonner";
import { Star, MapPin, Phone, Globe, Clock, Tag, Navigation, MessageCircle, ExternalLink, Heart, Send, Bookmark, Facebook, Instagram, Twitter, Youtube, Linkedin, Mail, Key, Chrome, Loader2, UserPlus, LogIn } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  raw?: any;
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

const getCityOrBranch = (address: string | null): string => {
  if (!address) return "Verified Location";
  const parts = address.split(',').map(p => p.trim());
  if (address.toLowerCase().includes("sholinganallur")) {
    return "Sholinganallur";
  }
  if (address.toLowerCase().includes("tirunelveli")) {
    return "Tirunelveli";
  }
  if (parts.length >= 3) {
    return parts[parts.length - 3];
  }
  return parts[1] || parts[0] || "Verified Location";
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
  return phoneRegex.test(phone);
};

const ListingPage = ({ subdomainSlug }: { subdomainSlug?: string }) => {
  const params = useParams();
  const slug = subdomainSlug || params.slug;
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [customDomainOpen, setCustomDomainOpen] = useState(false);
  const [customDomainLoading, setCustomDomainLoading] = useState(false);
  const [customDomainForm, setCustomDomainForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    desiredDomain: "",
  });

  // Fetch lead data to pre-populate custom domain request
  useEffect(() => {
    if (customDomainOpen && currentUser) {
      const fetchLeadData = async () => {
        try {
          const { data, error } = await supabase
            .from("leads")
            .select("name, company, phone, email")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data) {
            setCustomDomainForm({
              name: data.name || currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || "",
              email: currentUser.email || "",
              company: data.company || currentUser.user_metadata?.company || "",
              phone: data.phone || currentUser.user_metadata?.phone || "",
              desiredDomain: "",
            });
          } else {
            setCustomDomainForm({
              name: currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || "",
              email: currentUser.email || "",
              company: currentUser.user_metadata?.company || "",
              phone: currentUser.user_metadata?.phone || "",
              desiredDomain: "",
            });
          }
        } catch (err) {
          console.error("Error pre-populating domain request form:", err);
        }
      };
      fetchLeadData();
    }
  }, [customDomainOpen, currentUser]);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHoveringGallery, setIsHoveringGallery] = useState(false);
  const postsScrollRef = useRef<HTMLDivElement>(null);
  const [isHoveringPosts, setIsHoveringPosts] = useState(false);
  const [livePosts, setLivePosts] = useState<any[] | null>(null);
  const [liveTags, setLiveTags] = useState<string[] | null>(null);
  const [liveAbout, setLiveAbout] = useState<any[] | null>(null);
  const [liveServiceOptions, setLiveServiceOptions] = useState<any | null>(null);
  const [liveDescription, setLiveDescription] = useState<string | null>(null);
  const hasFetchedRef = useRef<string | null>(null);
  const [lightboxState, setLightboxState] = useState<{ 
    index: number; 
    items: Array<{ 
      src: string; 
      caption?: string; 
      date?: string; 
      isPost?: boolean; 
      callToAction?: { url: string; label: string } 
    }> 
  } | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [socialProfiles, setSocialProfiles] = useState<Array<{ name: string; url: string }>>([]);

  useEffect(() => {
    if (!slug) return;
    const dbSlug = slug === "tulips-multispeciality-hospital-sholinganallur"
      ? "tulips-multispeciality-hospital-chennai"
      : slug;
    supabase
      .from("listings")
      .select("*")
      .eq("slug", dbSlug)
      .maybeSingle()
      .then(({ data }) => {
        setListing(data as Listing | null);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (lightboxState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxState]);

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
    // Dynamically fetch tags, social profiles, and posts from SerpApi if not fully populated
    const fetchLiveData = async () => {
      if (!listing?.name || hasFetchedRef.current === listing.id) return;
      hasFetchedRef.current = listing.id;
      try {
        const apiKey = import.meta.env.VITE_SERPAPI_KEY;
        if (!apiKey) {
          console.error("VITE_SERPAPI_KEY is missing in this environment!");
          return;
        }
        console.log("Fetching live data for:", listing.name);

        // Extract the structured locality/city from raw data for a laser-focused search query
        // Google Knowledge Graphs pop reliably for "Name City", but fail for long exact addresses.
        let city = "";
        if (listing.raw?.addressComponents && Array.isArray(listing.raw.addressComponents)) {
          const comp = listing.raw.addressComponents.find((c: any) => 
            c.types?.includes("locality") || c.types?.includes("sublocality_level_1") || c.types?.includes("sublocality")
          );
          if (comp) city = comp.longText || comp.shortText;
        }
        
        // Fallback extraction if raw components are missing
        if (!city && listing.formatted_address) {
          const parts = listing.formatted_address.split(',').map((p: any) => p.trim());
          if (parts.length >= 3) {
            city = parts[parts.length - 3]; // Standard layout yields city here
          } else if (parts.length > 1) {
            city = parts[1];
          }
        }
        
        const finalSearchStr = city ? `${listing.name} ${city}` : listing.name;
        console.log("[SERP] Optimized Search Query Created:", finalSearchStr);

        const query = encodeURIComponent(finalSearchStr);
        const mapsUrl = `/api/serpapiProxy?engine=google_maps&q=${query}&api_key=${apiKey}`;
        const googleUrl = `/api/serpapiProxy?engine=google&q=${query}&api_key=${apiKey}`;
        
        console.log("[SERP] Initiating Sequential Discovery Fetch...");
        
        // Fetch Sequentially to strictly obey SerpApi's serial concurrency limits
        let mapsJson: any = null;
        try {
          console.log("[SERP] Fetching Google Maps Data...");
          const mapsRes = await fetch(mapsUrl);
          if (mapsRes.ok) {
            mapsJson = await mapsRes.json();
            console.log("[SERP] Maps Success:", !!mapsJson);
          } else {
            console.warn("[SERP] Maps fetch non-ok:", mapsRes.status);
          }
        } catch (e) {
          console.error("[SERP] Maps fetch failed:", e);
        }

        let googleJson: any = null;
        try {
          console.log("[SERP] Fetching Organic Search Profiles...");
          const googleRes = await fetch(googleUrl);
          if (googleRes.ok) {
            googleJson = await googleRes.json();
            console.log("[SERP] Organic Success:", !!googleJson);
          } else {
            console.warn("[SERP] Organic fetch non-ok:", googleRes.status);
          }
        } catch (e) {
          console.error("[SERP] Organic fetch failed:", e);
        }
        
        const placeResult = mapsJson?.local_results?.[0] || mapsJson?.place_results;
        const knowledgeGraph = googleJson?.knowledge_graph;
        
        console.log("[SERP] Knowledge Graph Detected:", !!knowledgeGraph);
        console.log("[SERP] Discovered Profiles Found:", knowledgeGraph?.profiles?.length || 0);

        // Debugging logs to help us find the exact paragraph if it's hidden elsewhere
        console.log("[SERP] Full Maps API Response:", mapsJson);
        console.log("[SERP] Full Google API Response:", googleJson);

        // Extract "From the business" description if available
        let newDesc = null;
        if (placeResult?.description) {
          newDesc = placeResult.description;
        } else if (knowledgeGraph?.merchant_description) {
          newDesc = knowledgeGraph.merchant_description;
        } else if (knowledgeGraph?.description) {
          newDesc = knowledgeGraph.description;
        } else if (knowledgeGraph?.detailed_description?.article_body) {
          newDesc = knowledgeGraph.detailed_description.article_body;
        }
        
        if (newDesc) {
           // Remove any leading or trailing double quotes that might come from the API
           const cleanDesc = newDesc.replace(/^"|"$/g, '').trim();
           console.log("[SERP] Supplementing description:", cleanDesc);
           setLiveDescription(cleanDesc);
        }

        // Augment listing with missing phone from knowledge graph if found
        if (!listing.phone && knowledgeGraph?.phone) {
          console.log("[SERP] Supplementing phone number from Knowledge Graph:", knowledgeGraph.phone);
          setListing(prev => prev ? { ...prev, phone: knowledgeGraph.phone } : null);
        }

        // Extract subcategories / tags
        if (placeResult?.type && Array.isArray(placeResult.type)) {
          setLiveTags(placeResult.type);
        }
        
        if (placeResult?.about && Array.isArray(placeResult.about)) {
          setLiveAbout(placeResult.about);
        }
        
        if (placeResult?.service_options) {
          setLiveServiceOptions(placeResult.service_options);
        }

        // Parse the extensions array: [{service_options: ["Onsite services"]}, {amenities: ["Restroom"]}, ...]
        if (placeResult?.extensions && Array.isArray(placeResult.extensions)) {
          const normalized = placeResult.extensions.map((ext: Record<string, string[]>) => {
            const [id, values] = Object.entries(ext)[0] || [];
            if (!id || !Array.isArray(values)) return null;
            return {
              id,
              options: values.map((v: string) => ({ name: v, enabled: true }))
            };
          }).filter(Boolean);
          if (normalized.length > 0) {
            setLiveAbout(prev => {
              const prevIds = new Set((prev || []).map((s: any) => s.id));
              const newSections = normalized.filter((s: any) => !prevIds.has(s.id));
              return [...(prev || []), ...newSections];
            });
          }
        }

        // Extract connected social media profiles from ALL SerpApi result sources
        const profiles: Array<{ name: string; url: string }> = [];
        
        // Helper to safely add discovered profiles uniquely
        const tryAddProfile = (name: string, url: string) => {
          if (!name || !url) return;
          // Check if already inserted
          if (profiles.some(p => p.url.replace(/\/$/, '') === url.replace(/\/$/, ''))) return;
          // Normalise name for canonical display
          let cleanName = name;
          if (url.includes("facebook.com")) cleanName = "Facebook";
          if (url.includes("instagram.com")) cleanName = "Instagram";
          if (url.includes("twitter.com") || url.includes("x.com")) cleanName = "X";
          if (url.includes("linkedin.com")) cleanName = "LinkedIn";
          if (url.includes("youtube.com")) cleanName = "YouTube";
          if (url.includes("pinterest.com")) cleanName = "Pinterest";
          profiles.push({ name: cleanName, url });
        };

        // 1. Standard profiles array from Knowledge Graph (VERY RELIABLE)
        if (knowledgeGraph?.profiles && Array.isArray(knowledgeGraph.profiles)) {
          knowledgeGraph.profiles.forEach((p: any) => tryAddProfile(p.name, p.link));
        }

        // 2. Profiles array from Maps if available
        if (placeResult?.profiles && Array.isArray(placeResult.profiles)) {
          placeResult.profiles.forEach((p: any) => tryAddProfile(p.name, p.link));
        }
        
        // 3. Recursive scan for any social media links inside BOTH search results
        const socialRegexes = [
          { name: "Facebook", regex: /https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9_.-]+/i },
          { name: "Instagram", regex: /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.-]+/i },
          { name: "X", regex: /https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_.-]+/i },
          { name: "LinkedIn", regex: /https?:\/\/(www\.)?linkedin\.com\/[a-zA-Z0-9_.-]+/i },
          { name: "YouTube", regex: /https?:\/\/(www\.)?youtube\.com\/[a-zA-Z0-9_.-]+/i }
        ];

        const foundUrls = new Set<string>();
        function scanForSocialUrls(obj: any) {
          if (!obj) return;
          if (typeof obj === 'string') {
            socialRegexes.forEach(({ name, regex }) => {
              const match = obj.match(regex);
              if (match && match[0] && !foundUrls.has(match[0])) {
                foundUrls.add(match[0]);
                tryAddProfile(name, match[0]);
              }
            });
          } else if (typeof obj === 'object') {
            for (const key in obj) {
              try {
                scanForSocialUrls(obj[key]);
              } catch (e) {
                // ignore
              }
            }
          }
        }
        
        // Scan maps response
        scanForSocialUrls(mapsJson);
        // Scan google search response (very powerful for finding profiles in organic list)
        scanForSocialUrls(googleJson);
        
        // 4. Fallback scan of listing raw stored in DB
        if (profiles.length === 0 && listing.raw) {
          scanForSocialUrls(listing.raw);
        }
        
        console.log("[SERP] Final Extracted Profiles:", profiles);
        setSocialProfiles(profiles);

        const dataId = placeResult?.data_id;
        if (!dataId) return;

        // Only fetch posts if they are missing from the DB
        if (!listing.posts || listing.posts.length === 0) {
          const postsUrl = `/api/serpapiProxy?engine=google_maps_posts&data_id=${dataId}&api_key=${apiKey}`;
          const postsRes = await fetch(postsUrl);
          const postsJson = await postsRes.json();
          
          if (postsJson.posts && Array.isArray(postsJson.posts)) {
            const mapped = postsJson.posts.map((post: any) => ({
              title: post.title || null,
              content: post.description || post.snippet || post.title || null,
              photoUri: post.thumbnails?.[0] || post.thumbnail || post.thumbnail_url || post.image_url || post.media?.[0]?.thumbnail || post.media?.[0]?.url || post.images?.[0] || null,
              publishTime: post.posted_at_text || post.date || null,
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

    if (listing && (!liveDescription || socialProfiles.length === 0)) {
      fetchLiveData();
    }
  }, [listing]);

  // Handle post-login redirection and listing claiming
  useEffect(() => {
    const processPendingClaim = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const pendingLeadStr = localStorage.getItem("storefries_pending_lead");
      const pendingUrl = localStorage.getItem("storefries_pending_url");
      const pendingSlug = localStorage.getItem("storefries_pending_slug") || listing?.slug;

      if (!pendingLeadStr && !pendingUrl) return;

      try {
        if (pendingLeadStr) {
          const leadData = JSON.parse(pendingLeadStr);
          console.log("Processing pending lead claim after sign in:", leadData);

          // Save lead details
          const leadEmail = leadData.email || session.user.email;
          if (leadEmail) {
            const leadPayload: any = {
              name: leadData.name,
              email: leadEmail,
              phone: leadData.phone || null,
              company: leadData.company,
              google_maps_url: leadData.google_maps_url,
              user_id: session.user.id,
              listing_url: window.location.href
            };
            const { error: leadErr } = await supabase.from("leads").insert([leadPayload]);
            if (leadErr) {
              console.warn("Lead saving post-signin failed with listing_url, trying fallback:", leadErr);
              const fallbackCompany = `${leadData.company} [Listing URL: ${window.location.href}]`;
              const { error: fallbackErr } = await supabase.from("leads").insert([{
                name: leadData.name,
                email: leadEmail,
                phone: leadData.phone || null,
                company: fallbackCompany,
                google_maps_url: leadData.google_maps_url,
                user_id: session.user.id
              }]);
              if (fallbackErr) console.error("Lead saving fallback error in post-signin:", fallbackErr);
            }
          }

          // Claim Listing
          const { error: claimErr } = await supabase.functions.invoke("generate-listing", {
            body: { url: leadData.google_maps_url, userId: session.user.id, slug: leadData.slug || pendingSlug },
          });
          if (claimErr) throw claimErr;

          setListing(prev => prev ? { ...prev, user_id: session.user.id } : null);
          toast.success("Page successfully published to your account!");
        } else if (pendingUrl) {
          console.log("Processing pending publish claim after sign in:", pendingUrl);

          // Save lead details for existing user
          const metadata = session.user.user_metadata || {};
          const leadName = metadata.name || metadata.full_name || session.user.email || "Unknown";
          const leadCompany = metadata.company || "Not Specified";
          const leadPhone = metadata.phone || null;

          const leadPayload: any = {
            name: leadName,
            email: session.user.email,
            phone: leadPhone,
            company: leadCompany,
            user_id: session.user.id,
            google_maps_url: pendingUrl,
            listing_url: window.location.href
          };
          const { error: leadErr } = await supabase.from("leads").insert([leadPayload]);
          if (leadErr) {
            console.warn("Lead saving for existing user failed with listing_url, trying fallback:", leadErr);
            const fallbackCompany = `${leadCompany} [Listing URL: ${window.location.href}]`;
            const { error: fallbackErr } = await supabase.from("leads").insert([{
              name: leadName,
              email: session.user.email,
              phone: leadPhone,
              company: fallbackCompany,
              user_id: session.user.id,
              google_maps_url: pendingUrl
            }]);
            if (fallbackErr) console.error("Lead saving fallback error for existing user:", fallbackErr);
          }

          // Claim Listing
          const { error: claimErr } = await supabase.functions.invoke("generate-listing", {
            body: { url: pendingUrl, userId: session.user.id, slug: pendingSlug },
          });
          if (claimErr) throw claimErr;

          setListing(prev => prev ? { ...prev, user_id: session.user.id } : null);
          toast.success("Premium landing page published successfully to your account!");
        }
      } catch (err: any) {
        console.error("Error claiming listing post-signin:", err);
        toast.error("Failed to complete publication after sign-in.");
      } finally {
        localStorage.removeItem("storefries_pending_lead");
        localStorage.removeItem("storefries_pending_url");
        localStorage.removeItem("storefries_pending_slug");
        localStorage.removeItem("storefries_redirect_back_url");
      }
    };

    if (currentUser) {
      processPendingClaim();
    }
  }, [currentUser]);

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
  const displayCategory = (liveTags && liveTags.length > 0)
    ? liveTags[0]
    : getBestCategory(listing.category, listing.raw, listing.name);

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
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.formatted_address ?? listing.name)}&place_id=${listing.place_id}`;

  const customizeText = `Hello! I would like to customize my page for ${listing?.name ?? ""} (${window.location.origin}${window.location.pathname})`;
  const customizeWhatsappLink = `https://wa.me/916374392488?text=${encodeURIComponent(customizeText)}`;

  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    listing.formatted_address ?? listing.name,
  )}&output=embed`;

  // Format whatsapp link
  const whatsappLink = listing.phone ? `https://wa.me/${listing.phone.replace(/[^0-9]/g, "")}` : null;

  const openGalleryLightbox = (startIndex: number) => {
    const items = photos.slice(1, 10).map(p => ({
      src: photoUrl(p.name, 1600),
      caption: `${listing.name} Gallery Image`
    }));
    setLightboxState({ index: startIndex, items });
  };

  const openPostsLightbox = (postIndex: number) => {
    if (!posts[postIndex]?.photoUri) return;
    const items = posts.filter(p => p.photoUri).map(p => ({
      src: p.photoUri!,
      caption: p.content || p.title,
      date: p.publishTime,
      isPost: true,
      callToAction: p.callToAction
    }));
    const clickedSrc = posts[postIndex].photoUri;
    const itemsIndex = items.findIndex(i => i.src === clickedSrc);
    if (itemsIndex !== -1) {
      setLightboxState({ index: itemsIndex, items });
    }
  };

  const handleCustomDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || !currentUser) return;

    if (!customDomainForm.name || !customDomainForm.company) {
      toast.error("Please fill in all required fields (Name and Company).");
      return;
    }

    if (customDomainForm.phone && !validatePhone(customDomainForm.phone)) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    setCustomDomainLoading(true);
    const mapsLink =
      listing.google_maps_url ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.formatted_address ?? listing.name)}&place_id=${listing.place_id}`;

    const payload: any = {
      name: customDomainForm.name,
      email: currentUser.email,
      phone: customDomainForm.phone || null,
      company: customDomainForm.company,
      user_id: currentUser.id,
      google_maps_url: mapsLink,
      desired_domain: customDomainForm.desiredDomain || null,
      listing_url: window.location.href
    };

    try {
      // 1. Try to save lead details with new columns first
      const { error: dbError } = await supabase.from("leads").insert([payload]);

      // If it fails, fallback to storing in company field
      if (dbError) {
        console.warn("DB insert with custom domain columns failed, falling back to legacy format:", dbError);
        const legacyCompany = customDomainForm.desiredDomain
          ? `${customDomainForm.company} [Custom Domain: ${customDomainForm.desiredDomain}] [Listing URL: ${window.location.href}]`
          : `${customDomainForm.company} [Listing URL: ${window.location.href}]`;
        
        const fallbackPayload = {
          name: customDomainForm.name,
          email: currentUser.email,
          phone: customDomainForm.phone || null,
          company: legacyCompany,
          user_id: currentUser.id,
          google_maps_url: mapsLink
        };
        const { error: fallbackError } = await supabase.from("leads").insert([fallbackPayload]);
        if (fallbackError) throw fallbackError;
      }

      // 2. Invoke the Edge Function to send email automatically in the background
      try {
        const { error: functionError } = await supabase.functions.invoke("request-custom-domain", {
          body: {
            name: customDomainForm.name,
            email: currentUser.email,
            phone: customDomainForm.phone || "",
            company: customDomainForm.company,
            desiredDomain: customDomainForm.desiredDomain,
            listingName: listing.name,
            listingUrl: window.location.href,
          },
        });
        if (functionError) {
          console.warn("Background email notification failed:", functionError);
        }
      } catch (fnErr) {
        console.warn("Background email notification error:", fnErr);
      }

      toast.success("Custom domain request submitted successfully! We will contact you soon.");
      setCustomDomainOpen(false);
    } catch (err: any) {
      console.error("Failed to submit custom domain request:", err);
      toast.error(err.message || "Failed to submit request. Please try again.");
    } finally {
      setCustomDomainLoading(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!listing) return;
    if (!confirm("Are you sure you want to delete this listing page? This action cannot be undone.")) {
      return;
    }

    setPublishing(true);
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listing.id);

      if (error) throw error;

      toast.success("Listing page deleted successfully.");
      navigate("/listings");
    } catch (err: any) {
      console.error("Error deleting listing:", err);
      toast.error(err.message || "Failed to delete listing.");
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = async () => {
    if (!listing) return;

    const mapsLink =
      listing.google_maps_url ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.formatted_address ?? listing.name)}&place_id=${listing.place_id}`;

    // If not logged in, redirect to sign-in page to collect details
    if (!currentUser) {
      localStorage.setItem("storefries_redirect_back_url", window.location.pathname);
      localStorage.setItem("storefries_pending_url", mapsLink);
      localStorage.setItem("storefries_pending_name", listing.name);
      localStorage.setItem("storefries_pending_slug", listing.slug);
      
      toast.info("Please sign in or sign up to publish this page.");
      navigate("/signin");
      return;
    }

    // Otherwise, claim it directly!
    setPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-listing", {
        body: { url: mapsLink, userId: currentUser.id, slug: listing.slug },
      });
      if (error) throw error;
      
      const metadata = currentUser.user_metadata || {};
      const leadName = metadata.name || metadata.full_name || currentUser.email || "Unknown";
      const leadCompany = metadata.company || "Not Specified";
      const leadPhone = metadata.phone || null;

      const publishPayload: any = {
        name: leadName,
        email: currentUser.email,
        phone: leadPhone,
        company: leadCompany,
        user_id: currentUser.id,
        google_maps_url: mapsLink,
        listing_url: window.location.href
      };

      const { error: leadErr } = await supabase.from("leads").insert([publishPayload]);

      if (leadErr) {
        console.warn("Saving publish lead with listing_url failed, trying fallback:", leadErr);
        const fallbackCompany = `${leadCompany} [Listing URL: ${window.location.href}]`;
        const { error: fallbackErr } = await supabase.from("leads").insert([{
          name: leadName,
          email: currentUser.email,
          phone: leadPhone,
          company: fallbackCompany,
          user_id: currentUser.id,
          google_maps_url: mapsLink
        }]);
        if (fallbackErr) console.error("Lead saving fallback error:", fallbackErr);
      }

      // Update local state user_id
      setListing(prev => prev ? { ...prev, user_id: currentUser.id } : null);
      toast.success("Premium landing page published successfully to your account!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to publish listing.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title={`${listing.name}${listing.formatted_address ? " — " + getCityOrBranch(listing.formatted_address) : ""} | Storefries`}
        description={
          listing.editorial_summary ??
          `${listing.name}${displayCategory ? ` (${displayCategory})` : ""}${listing.formatted_address ? " located at " + listing.formatted_address : ""}.`
        }
        image={heroPhoto ? photoUrl(heroPhoto.name, 1200) : undefined}
        jsonLd={jsonLd}
      />
      {listing.user_id && currentUser && (listing.user_id === currentUser.id || currentUser.email === "prakash04082002@gmail.com") && (
        <div className="bg-neutral-900 dark:bg-neutral-950 text-white py-3.5 px-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md relative z-50 transition-all duration-300">
          <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
            <span className="flex h-2 w-2 relative">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-xs md:text-sm font-semibold tracking-wide">
              You own this premium page. You have administrative access.
            </p>
          </div>
          <div className="flex gap-2.5 mx-auto sm:mx-0">
            <Button 
              onClick={() => setCustomDomainOpen(true)}
              className="h-8 px-6 bg-brand-blue hover:bg-brand-blue/80 text-white font-extrabold text-xs rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-0 flex-shrink-0 flex items-center gap-1.5"
            >
              Request Custom Domain
            </Button>
            <Button 
              onClick={handleDeleteListing}
              disabled={publishing}
              className="h-8 px-6 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-0 flex-shrink-0 flex items-center gap-1.5"
            >
              Delete page
            </Button>
          </div>
        </div>
      )}
      {!listing.user_id && (
        <div className="bg-gradient-to-r from-brand-blue via-purple-600 to-brand-green text-white py-3.5 px-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md relative z-50 transition-all duration-300">
          <div className="flex items-center gap-2.5 mx-auto sm:mx-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <p className="text-xs md:text-sm font-semibold tracking-wide">
              {currentUser ? (
                <>This premium page is currently unclaimed. Claim and publish it to your account!</>
              ) : (
                <>You are viewing a live preview of <span className="font-extrabold">{listing.name}</span>. Claim and publish this page now!</>
              )}
            </p>
          </div>
          <Button 
            onClick={handlePublish}
            disabled={publishing}
            className="h-8 px-6 bg-white hover:bg-neutral-100 text-brand-blue font-extrabold text-xs rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-0 flex-shrink-0 mx-auto sm:mx-0 flex items-center gap-1.5"
          >
            {publishing ? (
              <>Claiming...</>
            ) : currentUser ? (
              <>Claim page</>
            ) : (
              <>Publish page</>
            )}
          </Button>
        </div>
      )}
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
          
          <div className="absolute top-0 left-0 w-full pt-6">
            <div className="container flex justify-end">
              {displayCategory && (
                <span className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-brand-blue/90 rounded-full backdrop-blur-sm shadow-sm transition-all hover:bg-brand-blue hover:shadow-md cursor-default z-20">
                  {displayCategory}
                </span>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full">
            <div className="container pb-6 md:pb-10 flex flex-col items-start gap-1">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 block pb-1 text-left tracking-tight w-full">
                {listing.name}
              </h1>
              
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm md:text-base">
                {listing.rating != null && (
                  <div className="flex items-center gap-2 bg-background/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50">
                    <Stars value={listing.rating} />
                    <span className="font-semibold">{listing.rating}</span>
                    <span className="text-muted-foreground">({listing.user_ratings_total ?? 0} reviews)</span>
                  </div>
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
              <Link to={`/listings?folder=${encodeURIComponent(listing.name)}`} className="whitespace-nowrap px-4 py-2 rounded-full hover:bg-secondary text-brand-blue transition-colors flex items-center gap-1">
                Find More Branches <ExternalLink className="h-3 w-3" />
              </Link>
            </nav>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {!listing.user_id && (
                <Button 
                  onClick={handlePublish}
                  disabled={publishing}
                  className="h-9 px-5 rounded-full btn-gradient border-0 text-white font-extrabold text-xs shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-1.5"
                >
                  {publishing ? (
                    <>Publishing...</>
                  ) : (
                    <>Publish page</>
                  )}
                </Button>
              )}
              {listing.phone && (
                <Button asChild size="icon" title="Call" className="h-9 w-9 rounded-full bg-[#0073c8] hover:bg-[#0065ad] text-white border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 font-semibold">
                  <a href={`tel:${listing.phone}`}><Phone className="h-4 w-4" /></a>
                </Button>
              )}
              <Button asChild size="icon" title="Directions" className="h-9 w-9 rounded-full bg-[#34A853] hover:bg-[#2E964A] text-white border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 font-semibold">
                <a href={mapsLink} target="_blank" rel="noopener noreferrer"><MapPin className="h-4 w-4" /></a>
              </Button>
              {whatsappLink && (
                <Button asChild size="icon" title="WhatsApp" className="h-9 w-9 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 font-semibold">
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /></a>
                </Button>
              )}
              {(() => {
                // Unique social profiles by platform name to avoid duplicates
                const uniqueProfiles = Array.from(new Map(
                  socialProfiles.map(p => {
                    let normalizedKey = p.name.toLowerCase();
                    if (normalizedKey.includes("facebook")) normalizedKey = "facebook";
                    if (normalizedKey.includes("instagram")) normalizedKey = "instagram";
                    if (normalizedKey.includes("youtube")) normalizedKey = "youtube";
                    if (normalizedKey.includes("linkedin")) normalizedKey = "linkedin";
                    if (normalizedKey.includes("twitter") || normalizedKey === "x") normalizedKey = "x";
                    return [normalizedKey, p];
                  })
                ).values());

                return uniqueProfiles.map((p, idx) => {
                  const getSocialConfig = (name: string) => {
                    const n = name.toLowerCase();
                    if (n.includes("facebook") || n === "fb") return {
                      icon: <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
                      color: "bg-[#1877F2] hover:bg-[#166FE5]", label: "Facebook"
                    };
                    if (n.includes("instagram") || n === "ig") return {
                      icon: <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
                      color: "bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90", label: "Instagram"
                    };
                    if (n.includes("twitter") || n === "x" || n === "x (twitter)") return {
                      icon: <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 5.932zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
                      color: "bg-black hover:bg-gray-800", label: "X"
                    };
                    if (n.includes("youtube") || n === "yt") return {
                      icon: <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
                      color: "bg-[#FF0000] hover:bg-[#CC0000]", label: "YouTube"
                    };
                    if (n.includes("linkedin")) return {
                      icon: <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
                      color: "bg-[#0A66C2] hover:bg-[#004182]", label: "LinkedIn"
                    };
                    if (n.includes("pinterest")) return {
                      icon: <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>,
                      color: "bg-[#BD081C] hover:bg-[#AD081B]", label: "Pinterest"
                    };
                    return { icon: <Globe className="h-4 w-4" />, color: "bg-slate-500 hover:bg-slate-600", label: "Website" };
                  };

                  const config = getSocialConfig(p.name);

                  return (
                    <Button 
                      key={idx} 
                      asChild 
                      size="icon" 
                      className={`h-9 w-9 rounded-full text-white border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${config.color}`}
                      title={config.label}
                    >
                      <a href={p.url} target="_blank" rel="noopener noreferrer">
                        {config.icon}
                      </a>
                    </Button>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        <div className="container py-12 md:py-16 space-y-16 md:space-y-24">

          {listing.user_id === currentUser?.id && (
            <div className="relative overflow-hidden rounded-3xl border border-brand-blue/30 bg-gradient-to-br from-brand-blue/10 via-purple-600/5 to-background p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-blue/10 to-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
              <div className="space-y-2 flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue border border-brand-blue/20 text-xs font-bold uppercase tracking-wider">
                  <Star className="h-3 w-3 fill-current" /> Verified Owner Panel
                </div>
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">You have full access to this page!</h3>
                <p className="text-sm text-muted-foreground max-w-xl">
                  As the verified owner, you can fully customize this page (change colors, rewrite details, update gallery, manage posts/reviews, or link your custom domain).
                </p>
              </div>
              <Button asChild className="bg-[#25D366] hover:bg-[#20BA5A] text-white hover:scale-102 hover:-translate-y-0.5 active:scale-98 shadow-md hover:shadow-lg rounded-2xl h-12 px-6 font-extrabold transition-all duration-200 border-0 flex-shrink-0 flex items-center gap-2">
                <a href={customizeWhatsappLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5 fill-current" /> Contact Us to Customize
                </a>
              </Button>
            </div>
          )}
          
          {/* Overview Section */}
          <section id="overview" className="scroll-mt-24">
            <div className="grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_350px] gap-8 items-start">
              {/* About Content */}
              <div className="space-y-6 min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold break-words">About {listing.name}</h2>
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground leading-relaxed break-words">
                  {liveDescription ? (
                    <p>{liveDescription}</p>
                  ) : listing.editorial_summary ? (
                    <p>{listing.editorial_summary}</p>
                  ) : (
                    <p>{listing.name} is a local business{displayCategory ? ` categorized under ${displayCategory}` : ""}{listing.formatted_address ? `, located at ${listing.formatted_address}` : ""}.</p>
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
                         <div 
                           key={i} 
                           onClick={() => openGalleryLightbox(i)}
                           className="group relative flex-none w-[200px] h-[150px] md:w-[250px] md:h-[180px] rounded-xl overflow-hidden border border-border shadow-soft transition-all duration-500 hover:shadow-[0_0_25px_rgba(0,119,255,0.3)] hover:-translate-y-1 hover:border-brand-blue/50 cursor-pointer"
                         >
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
                    <div className="group relative">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-semibold flex justify-between items-center">
                        Address
                      </p>
                      <div className="flex items-start justify-between gap-3 mt-1">
                        <p className="text-sm font-medium leading-tight flex-1">{listing.formatted_address}</p>
                        <Button asChild size="icon" className="h-10 w-10 rounded-full flex-shrink-0 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-0">
                          <a href={mapsLink} target="_blank" rel="noopener noreferrer" title="Get Directions">
                            <MapPin className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
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
                        {listing.website.replace(/^https?:\/\//, "").replace(/\/+$/, "")}
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
                  {listing.user_id === currentUser?.id && (
                    <div className="pt-4 mt-4 border-t border-border/50 space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-bold">Owner Controls</p>
                      <Button asChild className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs flex items-center justify-center gap-1.5 py-2.5 h-10 border-0">
                        <a href={customizeWhatsappLink} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4 fill-current" /> Customize Page
                        </a>
                      </Button>
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
                 <Button asChild className="w-full bg-[#34A853] hover:bg-[#2E964A] border-0 text-white shadow-md hover:shadow-lg transition-all font-medium" size="sm">
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
                    in {getCityOrBranch(listing.formatted_address)}
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
                      <div 
                        key={i} 
                        className="flex-none w-[240px] md:w-[260px] group/post cursor-pointer"
                        onClick={() => {
                          if (post.photoUri) {
                            openPostsLightbox(i);
                          } else if (post.callToAction?.url) {
                            window.open(post.callToAction.url, "_blank", "noopener,noreferrer");
                          }
                        }}
                      >
                        <article className="h-full bg-background border border-border shadow-sm rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                          <div className="aspect-square w-full bg-white overflow-hidden flex items-center justify-center relative border-b border-border/50">
                            {post.photoUri ? (
                              <img src={post.photoUri} alt={post.title || post.content || "Post image"} referrerPolicy="no-referrer" className="w-full h-full object-contain group-hover/post:scale-105 transition-transform duration-500" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center p-5 bg-gradient-to-br from-brand-blue/5 to-brand-blue/10">
                                <p className="text-sm text-foreground/60 leading-relaxed line-clamp-6 text-center italic">
                                  {post.content || post.title || "Text post"}
                                </p>
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
                              <a 
                                href={post.callToAction?.url || mapsLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] font-bold text-brand-blue uppercase tracking-wider flex items-center gap-1 opacity-0 group-hover/post:opacity-100 transition-opacity hover:underline"
                              >
                                {post.callToAction?.label || "View"} <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </article>
                      </div>
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
                  <article key={i} className="group relative break-inside-avoid rounded-3xl card-tint-blue border border-border shadow-soft p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-400 overflow-hidden">
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

          {/* Business Features / About */}
          {((liveServiceOptions && Object.keys(liveServiceOptions).length > 0) || (liveAbout && Array.isArray(liveAbout) && liveAbout.length > 0)) && (
            <section id="features" className="scroll-mt-24">
              <h2 className="text-2xl md:text-3xl font-bold mb-8">About the Business</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-10">
                {/* Service Options — from service_options flat object */}
                {liveServiceOptions && Object.keys(liveServiceOptions).filter(k => liveServiceOptions[k] !== false).length > 0 && (
                  <div className="card-tint-blue rounded-2xl p-5 border border-brand-blue/15 shadow-soft">
                    <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-brand-blue flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      Service options
                    </h3>
                    <ul className="space-y-2.5">
                      {Object.entries(liveServiceOptions).map(([key, value]) => {
                        if (value === false) return null;
                        const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                        return (
                          <li key={key} className="flex items-center gap-2.5 text-[14px] text-muted-foreground">
                            <svg className="w-4 h-4 flex-shrink-0 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            <span>{label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                
                {/* All About sub-sections: Accessibility, Amenities, Crowd, Parking, etc. */}
                {liveAbout && Array.isArray(liveAbout) && liveAbout.map((section: any, idx: number) => {
                  const options = section.options || [];
                  if (options.length === 0) return null;
                  const sectionLabel = section.id
                    ? section.id.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
                    : "Details";

                  // Icon map for known section types
                  const iconPath: Record<string, string> = {
                    accessibility: "M12 2a3 3 0 100 6 3 3 0 000-6zm-1 9v6l-2 4h2l1-2 1 2h2l-2-4v-6h-2z",
                    service_options: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2",
                    amenities: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
                    crowd: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
                    parking: "M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h-3a2 2 0 00-2 2v8a2 2 0 002 2h3m0-10v10m0 0h3",
                    payments: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
                    children: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
                  };
                  const fallbackIcon = "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
                  const iconD = iconPath[section.id?.toLowerCase()] || fallbackIcon;

                  return (
                    <div key={idx} className="card-tint-blue rounded-2xl p-5 border border-brand-blue/15 shadow-soft">
                      <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-blue flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconD} /></svg>
                        {sectionLabel}
                      </h3>
                      <ul className="space-y-2.5">
                        {options.map((opt: any, i: number) => (
                          <li key={i} className={`flex items-center gap-2.5 text-[14px] ${opt.enabled === false ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                            {opt.enabled === false ? (
                              <svg className="w-4 h-4 flex-shrink-0 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            ) : (
                              <svg className="w-4 h-4 flex-shrink-0 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            )}
                            <span className={opt.enabled === false ? 'line-through' : ''}>{opt.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Category Tags */}
          {(displayCategory || (liveTags && liveTags.length > 0)) && (
            <section id="category" className="scroll-mt-24 pb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Categories & Tags</h3>
              <div className="flex flex-wrap gap-2.5">
                {displayCategory && (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-blue text-white shadow-md text-sm font-semibold border border-transparent hover:-translate-y-0.5 transition-transform cursor-default">
                    <Tag className="h-4 w-4" />
                    {displayCategory}
                  </div>
                )}
                
                {liveTags && liveTags.filter(t => t.toLowerCase() !== displayCategory?.toLowerCase()).map((tag, i) => (
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

      {/* Fullscreen Media Modal */}
      {lightboxState && lightboxState.items[lightboxState.index] && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setLightboxState(null)}
        >
          <button 
            className="fixed top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white p-2 rounded-full bg-black/50 hover:bg-black/80 transition-all z-[102]"
            onClick={() => setLightboxState(null)}
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>

          {/* Prev Button */}
          {lightboxState.index > 0 && (
            <button 
              className="fixed left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/80 transition-all z-[102]"
              onClick={(e) => { e.stopPropagation(); setLightboxState(s => s ? { ...s, index: s.index - 1 } : null); }}
              aria-label="Previous image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}

          {/* Next Button */}
          {lightboxState.index < lightboxState.items.length - 1 && (
            <button 
              className="fixed right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/80 transition-all z-[102]"
              onClick={(e) => { e.stopPropagation(); setLightboxState(s => s ? { ...s, index: s.index + 1 } : null); }}
              aria-label="Next image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
          
          <div className="min-h-full flex flex-col items-center justify-center p-2 md:p-8 py-12 md:py-16">
            <div 
              className="relative w-full max-w-5xl flex flex-col items-center animate-in zoom-in-95 duration-300 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxState.items[lightboxState.index].isPost ? (
                /* Combined Instagram Style Post Layout */
                <div className="bg-background rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-4xl border border-border/50 overflow-hidden text-foreground grid grid-cols-1 md:grid-cols-12 md:max-h-[85vh]">
                  {/* Left Column: Image Area */}
                  <div className="md:col-span-7 bg-neutral-50 border-r border-border/40 flex items-center justify-center p-2 relative min-h-[300px] md:min-h-[450px]">
                    <img 
                      src={lightboxState.items[lightboxState.index].src} 
                      alt={lightboxState.items[lightboxState.index].caption || "Post preview"} 
                      referrerPolicy="no-referrer"
                      className="max-w-full h-auto max-h-[50vh] md:max-h-[80vh] object-contain rounded-md" 
                    />
                  </div>

                  {/* Right Column: Premium Side Feed Panel */}
                  <div className="md:col-span-5 flex flex-col h-full bg-background md:max-h-[85vh]">
                    {/* Header: Author Info & Relocated Date */}
                    <div className="p-4 flex items-center gap-3 border-b border-border/60 bg-muted/20">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full overflow-hidden border border-border/60 flex items-center justify-center bg-brand-blue/10 text-brand-blue font-bold text-sm flex-shrink-0">
                        {heroPhoto ? (
                          <img 
                            src={photoUrl(heroPhoto.name, 100)} 
                            alt={listing.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          listing.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{listing.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 flex-wrap">
                          <MapPin className="h-3 w-3 text-brand-blue flex-shrink-0" />
                          <span>
                            {getCityOrBranch(listing.formatted_address)}
                          </span>
                          {lightboxState.items[lightboxState.index].date && (
                            <>
                              <span className="text-muted-foreground/50 mx-0.5">•</span>
                              <span className="text-brand-blue font-semibold">{lightboxState.items[lightboxState.index].date}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Scrollable Caption Body */}
                    <div className="p-4 flex-1 overflow-y-auto max-h-[45vh] md:max-h-[55vh] custom-scrollbar">
                      <div className="flex items-start gap-3">
                        {/* Caption Avatar */}
                        <div className="h-7 w-7 rounded-full overflow-hidden border border-border/60 flex items-center justify-center bg-brand-blue/10 text-brand-blue font-bold text-[10px] flex-shrink-0 mt-0.5">
                          {heroPhoto ? (
                            <img 
                              src={photoUrl(heroPhoto.name, 100)} 
                              alt={listing.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            listing.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-foreground mr-2">{listing.name}</span>
                          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap inline">
                            {lightboxState.items[lightboxState.index].caption}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Area with CTA Button */}
                    <div className="p-4 bg-muted/10 border-t border-border/60 mt-auto flex flex-col gap-3">
                      {lightboxState.items[lightboxState.index].callToAction?.url ? (
                        <a 
                          href={lightboxState.items[lightboxState.index].callToAction?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-blue to-brand-green text-white font-bold rounded-xl text-center text-xs tracking-wide shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all block"
                        >
                          {lightboxState.items[lightboxState.index].callToAction?.label || "Learn more"}
                        </a>
                      ) : (
                        <a 
                          href={mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold rounded-xl text-center text-xs tracking-wide transition-colors block"
                        >
                          View on Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Original / Standard Media Preview Layout for Non-Posts */
                <>
                  <div className="w-full flex items-center justify-center mb-6 relative">
                    <img 
                      src={lightboxState.items[lightboxState.index].src} 
                      alt={lightboxState.items[lightboxState.index].caption || "Media preview"} 
                      referrerPolicy="no-referrer"
                      className="max-w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-[0_0_40px_rgba(0,119,255,0.25)] ring-1 ring-white/10" 
                    />
                  </div>
                  
                  {(lightboxState.items[lightboxState.index].caption || lightboxState.items[lightboxState.index].date) && (
                    <div className="bg-background rounded-2xl shadow-[0_8px_30px_rgba(0,119,255,0.15)] w-full max-w-4xl text-left border border-brand-blue/20 relative overflow-hidden text-foreground">
                      <div className="absolute inset-0 card-tint-blue pointer-events-none" />
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-brand-blue to-brand-green opacity-80 z-10" />
                      <div className="relative z-20 p-6 md:p-8">
                        {lightboxState.items[lightboxState.index].caption && <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{lightboxState.items[lightboxState.index].caption}</p>}
                        {lightboxState.items[lightboxState.index].date && <p className="text-xs text-brand-blue mt-4 font-bold uppercase tracking-wider">{lightboxState.items[lightboxState.index].date}</p>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Custom Domain Shadcn Dialog */}
      <Dialog open={customDomainOpen} onOpenChange={setCustomDomainOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border/80 backdrop-blur-2xl bg-card/95 dark:bg-black/80 shadow-2xl p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-brand-blue to-purple-600 bg-clip-text text-transparent">
              Request Custom Domain
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-medium">
              Link your premium page <span className="text-foreground font-bold">{listing.name}</span> to a custom domain. We'll handle the configuration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCustomDomainSubmit} className="space-y-4 mt-4 text-left">
            <div className="space-y-1">
              <Label htmlFor="domain-name" className="text-xs font-bold text-foreground/80">Your Name *</Label>
              <Input
                id="domain-name"
                value={customDomainForm.name}
                onChange={(e) => setCustomDomainForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                className="rounded-xl border-border bg-background py-4 text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="domain-email" className="text-xs font-bold text-foreground/80">Email (Read-only)</Label>
              <Input
                id="domain-email"
                value={customDomainForm.email}
                className="rounded-xl border-border bg-muted py-4 text-xs font-semibold"
                disabled
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="domain-company" className="text-xs font-bold text-foreground/80">Company *</Label>
                <Input
                  id="domain-company"
                  value={customDomainForm.company}
                  onChange={(e) => setCustomDomainForm(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Company Name"
                  className="rounded-xl border-border bg-background py-4 text-xs font-semibold"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="domain-phone" className="text-xs font-bold text-foreground/80">Phone</Label>
                <Input
                  id="domain-phone"
                  type="tel"
                  pattern="^(\+?[0-9\s\-\(\)]{7,20})?$"
                  title="Please enter a valid phone number (digits, spaces, hyphens, and optional + prefix)."
                  value={customDomainForm.phone}
                  onChange={(e) => setCustomDomainForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91..."
                  className="rounded-xl border-border bg-background py-4 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="domain-desired" className="text-xs font-bold text-foreground/80">Desired Domain</Label>
              <Input
                id="domain-desired"
                value={customDomainForm.desiredDomain}
                onChange={(e) => setCustomDomainForm(prev => ({ ...prev, desiredDomain: e.target.value }))}
                placeholder="e.g., www.mybusiness.com"
                className="rounded-xl border-border bg-background py-4 text-xs font-semibold"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCustomDomainOpen(false)}
                className="flex-1 py-5 rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={customDomainLoading}
                className="flex-1 py-5 rounded-xl text-xs font-bold bg-brand-blue text-white hover:bg-brand-blue/90"
              >
                {customDomainLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Sending...
                  </>
                ) : (
                  <>Submit Request</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
