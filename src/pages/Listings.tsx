import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Star, MapPin, ChevronRight, ArrowLeft, Tag, Building2, Trash2, Loader2 } from "lucide-react";

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
  user_id?: string | null;
}

const Listings = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"brand" | "category" | "location">("brand");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const folderParam = searchParams.get("folder");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    supabase
      .from("listings")
      .select("slug,name,formatted_address,rating,user_ratings_total,category,photos,phone,raw,user_id")
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

    // Only enrich items missing from cache — cap at 3 per page load to avoid SerpApi concurrency limits
    const itemsToEnrich = rows
      .filter(r => !dynamicCategories[r.slug] && !fetchedSlugsRef.current.has(r.slug))
      .slice(0, 3); // Hard cap: SerpApi free plan = 1 concurrent search at a time

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

          const res = await fetch(`/api/serpapiProxy?engine=google_maps&q=${query}&api_key=${apiKey}`);
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
          // 2-second gap: strictly serial to avoid SerpApi 429 / concurrency errors
          await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
          console.error("Failed dynamic resolve:", item.name, err);
        }
      }
    };

    processEnrichments();
  }, [rows]); // Only re-run when rows change, NOT when dynamicCategories changes (prevents feedback loop)

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
    const rawClean = name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
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

  useEffect(() => {
    if (folderParam && folders.length > 0 && !selectedFolder) {
      const cleanString = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const cleanFolderParam = cleanString(folderParam);

      // Find exact match after cleaning
      let match = folders.find(f => cleanString(f) === cleanFolderParam);
      
      if (!match) {
        // Fallback to searching if folderParam starts with the folder name, or folder name starts with folderParam
        match = folders.find(f => {
          const cleanF = cleanString(f);
          return cleanFolderParam.startsWith(cleanF) || cleanF.startsWith(cleanFolderParam);
        });
      }
      if (match) {
        setSelectedFolder(match);
      }
    }
  }, [folderParam, folders, selectedFolder]);

  const getFolderIcon = () => {
    if (viewMode === "location") return MapPin;
    if (viewMode === "category") return Tag;
    return Building2;
  };
  
  const ActiveFolderIcon = getFolderIcon();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Modern Grid Background Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      
      {/* Floating High-End Ambient Glows */}
      <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute top-[400px] right-0 w-[700px] h-[700px] bg-brand-green/[0.03] rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-1/4 w-[800px] h-[800px] bg-[#8b5cf6]/5 rounded-full blur-[220px] pointer-events-none z-0" />
      
      <Seo title="Browse Listings | Storefries" description="Browse all generated business landing pages." />
      <SiteHeader />

      <main className="flex-1 container py-16 relative z-10">
        {!selectedFolder ? (
          <>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 pb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Browse Directory
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  Explore curated local businesses and landing pages, beautifully organized to help you find exactly what you're looking for.
                </p>
              </div>
              
              {/* Premium Tactile Grouping Toggle */}
              <div className="flex p-1.5 bg-card/90 dark:bg-black/40 backdrop-blur-md rounded-2xl w-fit border border-border shadow-[0_2px_12px_rgba(0,0,0,0.03)] self-start lg:self-end">
                {[
                  { id: "brand", label: "Companies", icon: Building2 },
                  { id: "location", label: "Locations", icon: MapPin },
                  { id: "category", label: "Categories", icon: Tag }
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isActive = viewMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id as any)}
                      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 relative ${
                        isActive 
                          ? "bg-background text-brand-blue shadow-md border border-border/50 scale-[1.02]" 
                          : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                      }`}
                    >
                      <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="mb-16 pb-8">
            <button 
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-brand-blue/80 mb-6 py-2 group transition-all duration-200 bg-brand-blue/5 px-4 rounded-full" 
              onClick={() => setSelectedFolder(null)}
            >
              <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform duration-200" /> 
              Back to Directory
            </button>
            
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="h-16 w-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue border border-brand-blue/10 shadow-sm">
                <ActiveFolderIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-2 leading-tight">
                  {selectedFolder}
                </h1>
                <p className="text-muted-foreground text-lg font-medium">
                  Showing {activeGroups[selectedFolder]?.length || 0} premium {activeGroups[selectedFolder]?.length === 1 ? 'listing' : 'listings'} available.
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="h-12 w-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Curating listings...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="card-tint-blue rounded-3xl p-16 text-center border border-border/50 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue mx-auto mb-6">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No listings created yet</h3>
            <p className="text-muted-foreground mb-8">Be the first to launch an interactive directory landing page.</p>
            <Link to="/" className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-bold btn-gradient shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/30 hover:scale-[1.02] transition-all duration-200">
              Generate New Listing
            </Link>
          </div>
        ) : !selectedFolder ? (
          // REDESIGNED FOLDERS VIEW
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {folders.map((folder) => {
              const items = activeGroups[folder];
              const photos = items
                .map(r => {
                  const p = (r.photos ?? []) as Array<{ name: string }>;
                  return p[0]?.name;
                })
                .filter(Boolean)
                .slice(0, 3);
              
              const uniqueCities = Array.from(new Set(items.map(r => getCityForGrouping(r)))).filter(c => c !== "Other Locations");
              
              // Formulate initials
              const initials = folder
                .replace(/[^a-zA-Z0-9 ]/g, "")
                .split(' ')
                .filter(w => w.length > 0)
                .map(w => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              // Smart Gradient Generation based on name
              let hash = 0;
              for (let i = 0; i < folder.length; i++) {
                hash = folder.charCodeAt(i) + ((hash << 5) - hash);
              }
              const gradients = [
                "from-[#3b82f6] to-[#2563eb]", // blue
                "from-[#8b5cf6] to-[#7c3aed]", // violet
                "from-[#ec4899] to-[#db2777]", // pink
                "from-[#f59e0b] to-[#d97706]", // amber
                "from-[#10b981] to-[#059669]", // emerald
                "from-[#6366f1] to-[#4f46e5]", // indigo
                "from-[#06b6d4] to-[#0891b2]"  // cyan
              ];
              const gradClass = gradients[Math.abs(hash) % gradients.length];

              return (
                <div 
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className="cursor-pointer group relative flex flex-col bg-card rounded-3xl border border-border/60 p-7 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,115,200,0.08)] hover:border-brand-blue/20 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden"
                >
                  {/* Decorative background glow */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-blue/5 rounded-full blur-3xl group-hover:bg-brand-blue/10 transition-all duration-500 z-0" />
                  
                  <div className="flex items-start justify-between mb-10 relative z-10">
                    {/* Rich Overlapping Avatars or Colored Initials */}
                    {photos.length > 0 ? (
                      <div className="flex -space-x-3 overflow-hidden">
                        {photos.map((photo, idx) => (
                          <img
                            key={idx}
                            className="inline-block h-12 w-12 rounded-2xl ring-4 ring-background object-cover shadow-sm transition-all group-hover:scale-110 duration-500"
                            style={{ transitionDelay: `${idx * 50}ms`, zIndex: 3 - idx }}
                            src={photoUrl(photo, 150)}
                            alt=""
                          />
                        ))}
                        {items.length > photos.length && (
                          <div className="inline-flex h-12 w-12 rounded-2xl ring-4 ring-background bg-muted items-center justify-center text-xs font-extrabold text-muted-foreground shadow-sm relative z-0">
                            +{items.length - photos.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradClass} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-500`}>
                        <span className="font-extrabold text-[13px] tracking-wider">{initials || <ActiveFolderIcon className="h-5 w-5" />}</span>
                      </div>
                    )}

                    {/* Distinct Pill Badge */}
                    <span className="whitespace-nowrap bg-brand-blue/5 text-brand-blue text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full border border-brand-blue/10 group-hover:bg-brand-blue group-hover:text-white group-hover:border-transparent transition-all duration-300">
                      {items.length} {items.length === 1 ? 'Location' : 'Locations'}
                    </span>
                  </div>

                  <div className="relative z-10 mt-auto">
                    <h3 className="text-xl font-extrabold text-foreground mb-2.5 group-hover:text-brand-blue transition-colors line-clamp-2 leading-snug tracking-tight">
                      {folder}
                    </h3>
                    
                    {viewMode === "brand" && uniqueCities.length > 0 && (
                      <p className="text-[13px] text-muted-foreground font-medium flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 flex-shrink-0" />
                        <span>{uniqueCities.join(", ")}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-6 pt-5 border-t border-border/50 group-hover:border-brand-blue/20 transition-colors">
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-brand-blue transition-colors tracking-wide">
                        Explore Listings
                      </span>
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-brand-blue group-hover:text-white transition-all duration-300 transform translate-x-1 opacity-70 group-hover:translate-x-0 group-hover:opacity-100">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // REDESIGNED LISTINGS GRID VIEW (For selected folder)
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {(activeGroups[selectedFolder] || []).map((r) => {
              const photos = (r.photos ?? []) as Array<{ name: string }>;
              const heroPhoto = photos[0];
              const displaySlug = r.slug === "tulips-multispeciality-hospital-chennai"
                ? "tulips-multispeciality-hospital-sholinganallur"
                : r.slug;
              
              const displayCategory = dynamicCategories[r.slug] || getBestCategory(r.category, r.raw, r.name);
              const canDelete = currentUser && (
                r.user_id === currentUser.id ||
                currentUser.email === "prakash04082002@gmail.com"
              );
              
              return (
                <Link
                  key={displaySlug}
                  to={`/l/${displaySlug}`}
                  className="group relative flex flex-col bg-card rounded-3xl border border-border/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500 overflow-hidden"
                >
                  <div className="relative h-56 w-full bg-muted overflow-hidden">
                    {heroPhoto ? (
                      <img 
                        src={photoUrl(heroPhoto.name, 600)} 
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 flex items-center justify-center">
                        <MapPin className="h-10 w-10 text-brand-blue/40 animate-pulse" />
                      </div>
                    )}
                    
                    {/* Rich Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {displayCategory && (
                      <div className="absolute top-4 left-4 bg-background/85 backdrop-blur-md border border-white/20 shadow-sm px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-foreground">
                        {displayCategory}
                      </div>
                    )}

                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteListing(e, r.slug)}
                        className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 backdrop-blur-md flex items-center justify-center transition-all duration-300 shadow-sm"
                        title="Delete Listing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col relative z-10">
                    <h3 className="font-extrabold text-lg mb-2.5 text-foreground group-hover:text-brand-blue transition-colors line-clamp-2 leading-snug tracking-tight">
                      {r.name}
                    </h3>
                    
                    {r.rating != null && (
                      <div className="flex items-center gap-1.5 text-sm mb-4">
                        <div className="flex items-center gap-1 bg-[#ffb545]/10 px-2 py-0.5 rounded-md">
                          <Star className="h-3.5 w-3.5 fill-[#ffb545] text-[#ffb545]" />
                          <span className="font-bold text-[#e29522]">{r.rating}</span>
                        </div>
                        <span className="text-muted-foreground text-xs font-medium">({r.user_ratings_total ?? 0} reviews)</span>
                      </div>
                    )}
                    
                    <div className="mt-auto pt-5 border-t border-border/50 space-y-3">
                      {r.formatted_address && (
                        <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-brand-blue/60" />
                          <span className="line-clamp-2 leading-relaxed text-[13px] font-medium">{r.formatted_address}</span>
                        </div>
                      )}
                      {r.phone && (
                         <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-brand-blue/60"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                           <span className="truncate font-bold text-[13px]">{r.phone}</span>
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
