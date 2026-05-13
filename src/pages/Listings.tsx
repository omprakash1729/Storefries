import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Star, MapPin, Folder, ChevronRight, ArrowLeft, Tag, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { photoUrl } from "@/lib/photo";
import { getBestCategory } from "@/lib/utils";

interface Row {
  slug: string;
  name: string;
  formatted_address: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  category: string | null;
  photos: any;
  phone: string | null;
  raw: any;
}

const Listings = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"brand" | "category" | "location">("brand");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("listings")
      .select("slug,name,formatted_address,rating,user_ratings_total,category,photos,phone,raw")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, []);
  
  const [dynamicCategories, setDynamicCategories] = useState<Record<string, string>>(() => {
    try {
      const cached = localStorage.getItem("storefries_live_categories");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const fetchedSlugsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (rows.length === 0) return;
    
    // Universal Enrichment: Fetch live categories for ANY item that is missing from our live cache
    const itemsToEnrich = rows.filter(r => {
      // If we already have it cached or resolved, skip enrichment!
      if (dynamicCategories[r.slug]) return false;
      // Avoid duplicate requests within this page session
      return !fetchedSlugsRef.current.has(r.slug);
    });

    if (itemsToEnrich.length === 0) return;

    const processEnrichments = async () => {
      const apiKey = import.meta.env.VITE_SERPAPI_KEY;
      if (!apiKey) return;

      for (const item of itemsToEnrich) {
        if (fetchedSlugsRef.current.has(item.slug)) continue;
        fetchedSlugsRef.current.add(item.slug);

        try {
          let city = "";
          if (item.raw?.addressComponents && Array.isArray(item.raw.addressComponents)) {
            const comp = item.raw.addressComponents.find((c: any) => 
              c.types?.includes("locality") || c.types?.includes("sublocality_level_1") || c.types?.includes("sublocality")
            );
            if (comp) city = comp.longText || comp.shortText;
          }
          if (!city && item.formatted_address) {
            const parts = item.formatted_address.split(',').map((p: any) => p.trim());
            if (parts.length >= 3) city = parts[parts.length - 3];
            else if (parts.length > 1) city = parts[1];
          }
          
          const searchStr = city ? `${item.name} ${city}` : item.name;
          const query = encodeURIComponent(searchStr);
          const mapsUrl = `/api/serpapiProxy?engine=google_maps&q=${query}&api_key=${apiKey}`;

          const res = await fetch(mapsUrl);
          if (res.ok) {
            const mapsJson = await res.json();
            const local = mapsJson.local_results?.[0] || mapsJson.place_results;
            const realType = local?.type && Array.isArray(local.type) && local.type.length > 0 ? local.type[0] : null;
            if (realType) {
              setDynamicCategories(prev => {
                const updated = { ...prev, [item.slug]: realType };
                localStorage.setItem("storefries_live_categories", JSON.stringify(updated));
                return updated;
              });
            }
          }
          await new Promise(res => setTimeout(res, 1000)); // Polite delay between serial API fetches
        } catch (err) {
          console.error("Failed dynamic resolve:", item.name, err);
        }
      }
    };

    processEnrichments();
  }, [rows, dynamicCategories]);

  const handleDeleteListing = async (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this listing?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("slug", slug);
        
      if (error) throw error;
      
      toast.success("Listing deleted successfully");
      setRows(prev => prev.filter(r => r.slug !== slug));
    } catch (err) {
      console.error("Deletion failed:", err);
      toast.error("Failed to delete listing");
    }
  };

  // Smart NLP String Similarity Algorithm (Sørensen–Dice coefficient)
  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const stringSimilarity = (str1: string, str2: string) => {
    if (str1 === str2) return 1;
    if (str1.length < 2 || str2.length < 2) return 0;
    
    const bg1 = getBigrams(str1);
    const bg2 = getBigrams(str2);
    let intersectionSize = 0;
    
    for (const bg of bg1) {
      if (bg2.has(bg)) intersectionSize++;
    }
    
    return (2.0 * intersectionSize) / (bg1.size + bg2.size);
  };

  const cleanNameFromLocation = (name: string, address: string | null) => {
    let rawClean = name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!address) return rawClean;
    
    const addressLower = address.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
    const addressWords = new Set(addressLower.split(' ').filter(w => w.length > 2));
    
    const nameWords = rawClean.split(' ');
    
    let wordsToRemove = 0;
    // Only check the last 2 words at most to prevent stripping the whole name
    const maxToRemove = Math.min(2, nameWords.length - 1);
    
    for (let i = nameWords.length - 1; i >= nameWords.length - maxToRemove; i--) {
      // Protected words that shouldn't be stripped even if they appear in the address
      const protectedWords = ['hospital', 'clinic', 'restaurant', 'cafe', 'store', 'shop', 'mart', 'supermarket', 'school', 'college', 'university', 'gym', 'salon', 'spa'];
      if (protectedWords.includes(nameWords[i])) {
        break;
      }
      
      if (addressWords.has(nameWords[i])) {
        wordsToRemove++;
      } else {
        break;
      }
    }
    
    if (wordsToRemove > 0) {
      return nameWords.slice(0, nameWords.length - wordsToRemove).join(' ');
    }
    
    return rawClean;
  };

  // ML-style Clustering Algorithm
  const clusterListings = (items: Row[]) => {
    const clusters: Record<string, Row[]> = {};
    const clusterCenters: Record<string, string> = {};

    // First clean the names and map them
    const cleanedItems = items.map(row => ({
      ...row,
      cleanName: cleanNameFromLocation(row.name, row.formatted_address)
    }));

    // Sort by clean name length so shortest (base) names become the cluster centers
    const sortedRows = [...cleanedItems].sort((a, b) => a.cleanName.length - b.cleanName.length);

    for (const row of sortedRows) {
      const rawClean = row.cleanName;
      
      let bestMatch: string | null = null;
      let highestScore = 0;

      for (const [displayBrand, centerClean] of Object.entries(clusterCenters)) {
        // High confidence match: If the longer name simply starts with the base brand name
        if (rawClean.startsWith(centerClean + ' ') || rawClean === centerClean) {
          bestMatch = displayBrand;
          highestScore = 1;
          break;
        }
        
        // Also check if the centerClean starts with rawClean (in case sorting didn't perfectly order by prefix)
        if (centerClean.startsWith(rawClean + ' ')) {
          bestMatch = displayBrand;
          highestScore = 1;
          break;
        }
        
        // Fuzzy match: Calculate string similarity score
        const score = stringSimilarity(rawClean, centerClean);
        if (score > highestScore && score > 0.65) { // 65% similarity threshold
          highestScore = score;
          bestMatch = displayBrand;
        }
      }

      // Remove cleanName before pushing to clusters to keep types clean
      const { cleanName, ...originalRow } = row;

      if (bestMatch && highestScore > 0.65) {
        clusters[bestMatch].push(originalRow as Row);
      } else {
        // Create new cluster
        // Title Case the base name for display
        const displayBrand = rawClean.replace(/\b\w/g, c => c.toUpperCase());
        clusters[displayBrand] = [originalRow as Row];
        clusterCenters[displayBrand] = rawClean;
      }
    }

    return clusters;
  };

  // --- Multi-mode grouping logic ---

  const getCategoryForGrouping = (r: Row) => {
    const best = dynamicCategories[r.slug] || getBestCategory(r.category, r.raw, r.name);
    return best || "Other Categories";
  };

  const getCityForGrouping = (r: Row) => {
    if (!r.formatted_address) return "Other Locations";
    
    // Try structured address first
    if (r.raw?.addressComponents && Array.isArray(r.raw.addressComponents)) {
      const comp = r.raw.addressComponents.find((c: any) => 
        c.types?.includes("locality") || c.types?.includes("sublocality_level_1") || c.types?.includes("sublocality")
      );
      if (comp) return comp.longText || comp.shortText;
    }
    
    // Fallback logic matching Listing page
    const addr = r.formatted_address.toLowerCase();
    if (addr.includes("sholinganallur")) return "Sholinganallur";
    if (addr.includes("chennai")) return "Chennai";
    if (addr.includes("madurai")) return "Madurai";
    if (addr.includes("tirunelveli")) return "Tirunelveli";
    
    const parts = r.formatted_address.split(',').map((p: string) => p.trim());
    if (parts.length >= 3) return parts[parts.length - 3];
    return parts[1] || parts[0] || "Other Locations";
  };

  const groupedByBrand = clusterListings(rows);

  const groupedByCategory: Record<string, Row[]> = {};
  rows.forEach(r => {
    const cat = getCategoryForGrouping(r);
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(r);
  });

  const groupedByLocation: Record<string, Row[]> = {};
  rows.forEach(r => {
    const loc = getCityForGrouping(r);
    if (!groupedByLocation[loc]) groupedByLocation[loc] = [];
    groupedByLocation[loc].push(r);
  });

  const activeGroups = viewMode === "category" 
    ? groupedByCategory 
    : viewMode === "location" 
      ? groupedByLocation 
      : groupedByBrand;

  const folders = Object.keys(activeGroups).sort();

  const getFolderIcon = () => {
    if (viewMode === "location") return MapPin;
    if (viewMode === "category") return Tag;
    return Building2;
  };
  
  const ActiveFolderIcon = getFolderIcon();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo title="Browse Listings | Storefries" description="Browse all generated business landing pages." />
      <SiteHeader />
      <main className="flex-1 container py-12">
        {!selectedFolder ? (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Browse Listings</h1>
                <p className="text-muted-foreground">Select how you want to organize and view listings.</p>
              </div>
              
              {/* Grouping Toggle */}
              <div className="flex p-1 bg-secondary/50 rounded-xl w-fit backdrop-blur-sm border border-border/50">
                {[
                  { id: "brand", label: "Companies", icon: Building2 },
                  { id: "location", label: "Locations", icon: MapPin },
                  { id: "category", label: "Categories", icon: Tag }
                ].map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id as any)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        viewMode === mode.id 
                          ? "bg-background text-brand-blue shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="mb-8">
            <Button 
              variant="ghost" 
              className="mb-4 pl-0 hover:bg-transparent hover:text-brand-blue" 
              onClick={() => setSelectedFolder(null)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <ActiveFolderIcon className="h-8 w-8 text-brand-blue/70" />
              {selectedFolder}
            </h1>
            <p className="text-muted-foreground">Showing {activeGroups[selectedFolder]?.length || 0} matching listings.</p>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <div className="card-tint-blue rounded-2xl p-10 text-center border border-border/50">
            <p className="text-muted-foreground">No listings yet. <Link to="/" className="text-brand-blue font-medium">Generate one</Link>.</p>
          </div>
        ) : !selectedFolder ? (
          // FOLDERS VIEW
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {folders.map((folder) => (
              <div 
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className="cursor-pointer group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white transition-all duration-300">
                    <ActiveFolderIcon className="h-6 w-6" />
                  </div>
                  <span className="bg-secondary text-xs font-semibold px-2.5 py-1 rounded-full text-muted-foreground group-hover:text-foreground transition-colors">
                    {activeGroups[folder].length} {activeGroups[folder].length === 1 ? 'Location' : 'Locations'}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1 group-hover:text-brand-blue transition-colors line-clamp-2">{folder}</h3>
                <p className="text-sm text-brand-blue/70 flex items-center gap-1 mt-auto pt-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                  View listings <ChevronRight className="h-3 w-3" />
                </p>
              </div>
            ))}
          </div>
        ) : (
          // LISTINGS GRID VIEW (For selected folder)
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {(activeGroups[selectedFolder] || []).map((r) => {
              const photos = (r.photos ?? []) as Array<{ name: string }>;
              const heroPhoto = photos[0];
              const displaySlug = r.slug === "tulips-multispeciality-hospital-chennai"
                ? "tulips-multispeciality-hospital-sholinganallur"
                : r.slug;
              
              const displayCategory = dynamicCategories[r.slug] || getBestCategory(r.category, r.raw, r.name);
              
              return (
                <Link
                  key={displaySlug}
                  to={`/l/${displaySlug}`}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="relative h-48 w-full bg-muted overflow-hidden">
                    {heroPhoto ? (
                      <img 
                        src={photoUrl(heroPhoto.name, 600)} 
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-brand-blue/50" />
                      </div>
                    )}
                    {displayCategory && (
                      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-foreground">
                        {displayCategory}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-brand-blue transition-colors">{r.name}</h3>
                    
                    {r.rating != null && (
                      <div className="flex items-center gap-1.5 text-sm mb-3">
                        <Star className="h-4 w-4 fill-brand-blue text-brand-blue" />
                        <span className="font-semibold">{r.rating}</span>
                        <span className="text-muted-foreground text-xs">({r.user_ratings_total ?? 0} reviews)</span>
                      </div>
                    )}
                    
                    <div className="mt-auto pt-4 border-t border-border/50 space-y-2">
                      {r.formatted_address && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand-blue/70" />
                          <span className="line-clamp-2 leading-tight">{r.formatted_address}</span>
                        </div>
                      )}
                      {r.phone && (
                         <div className="flex items-center gap-2 text-sm text-muted-foreground">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-brand-blue/70"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                           <span className="truncate">{r.phone}</span>
                         </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Listings;
