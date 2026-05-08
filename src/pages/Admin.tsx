import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Settings, 
  Trash2, 
  Edit, 
  Search, 
  Globe, 
  Phone, 
  MapPin, 
  FileText, 
  Link2, 
  Layers, 
  Plus, 
  Sparkles,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

interface ListingRow {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  formatted_address: string | null;
  phone: string | null;
  website: string | null;
  editorial_summary: string | null;
  raw?: any;
}

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"listings" | "settings">("listings");
  
  // Edit State
  const [editingListing, setEditingListing] = useState<ListingRow | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form Fields
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editSummary, setEditSummary] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchListings = (activeUser = user) => {
    if (!activeUser) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("listings")
      .select("id,slug,name,category,formatted_address,phone,website,editorial_summary,raw")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast.error("Error loading listings: " + error.message);
        } else {
          // Strict Tenant Isolation: Only show pages created by or assigned to this user
          const filtered = (data ?? []).filter((item: any) => {
            const rawPayload = item.raw ? (typeof item.raw === 'string' ? JSON.parse(item.raw) : item.raw) : {};
            return rawPayload.userId === activeUser.id;
          });
          setListings(filtered);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user) {
      fetchListings(user);
    }
  }, [user]);

  const handleEditClick = (listing: ListingRow) => {
    setEditingListing(listing);
    setEditName(listing.name || "");
    setEditSlug(listing.slug || "");
    setEditCategory(listing.category || "");
    setEditPhone(listing.phone || "");
    setEditWebsite(listing.website || "");
    setEditAddress(listing.formatted_address || "");
    setEditSummary(listing.editorial_summary || "");
  };

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    if (!editName.trim() || !editSlug.trim()) {
      toast.error("Name and Slug are required!");
      return;
    }

    setSaving(true);
    try {
      const existingRaw = editingListing.raw ? (typeof editingListing.raw === 'string' ? JSON.parse(editingListing.raw) : editingListing.raw) : {};
      const updatedRaw = {
        ...existingRaw,
        userId: user?.id,
      };

      const { error } = await supabase
        .from("listings")
        .update({
          name: editName,
          slug: editSlug,
          category: editCategory || null,
          phone: editPhone || null,
          website: editWebsite || null,
          formatted_address: editAddress || null,
          editorial_summary: editSummary || null,
          raw: updatedRaw,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingListing.id);

      if (error) throw error;
      
      toast.success("Listing updated successfully!");
      setEditingListing(null);
      fetchListings();
    } catch (err: any) {
      toast.error("Failed to update listing: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Listing deleted successfully!");
      fetchListings();
    } catch (err: any) {
      toast.error("Failed to delete listing: " + err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/admin",
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error("Google Sign-In failed: " + err.message);
    }
  };

  const filteredListings = listings.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.slug.toLowerCase().includes(search.toLowerCase()) ||
    (l.category && l.category.toLowerCase().includes(search.toLowerCase())) ||
    (l.formatted_address && l.formatted_address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo title="Admin Dashboard | Storefries" description="Manage and customize your business listings." />
      <SiteHeader />
      
      <main className="flex-1 container py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-brand-blue" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Configure, customize, and manage your generated landing pages.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={activeTab === "listings" ? "cta" : "outline"} 
              className="rounded-full"
              onClick={() => { setActiveTab("listings"); setEditingListing(null); }}
            >
              Manage Listings
            </Button>
            <Button 
              variant={activeTab === "settings" ? "cta" : "outline"} 
              className="rounded-full"
              onClick={() => { setActiveTab("settings"); setEditingListing(null); }}
            >
              Brand Config
            </Button>
          </div>
        </div>

        {authLoading ? (
          <div className="py-20 text-center text-muted-foreground">
            Checking authorization...
          </div>
        ) : !user ? (
          <div className="max-w-md mx-auto py-12 px-6 card-tint-blue rounded-3xl border border-border/60 text-center shadow-soft mt-10">
            <ShieldAlert className="h-12 w-12 text-brand-blue mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Access Restricted</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              One person should not manage another's pages. Please sign in with Google to view, customize, and manage only your own business listings.
            </p>
            <Button
              onClick={handleGoogleSignIn}
              className="rounded-full bg-background border border-border/80 hover:bg-muted text-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-3 px-6 py-5 mx-auto"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign In with Google
            </Button>
          </div>
        ) : (
          <>
            {activeTab === "listings" ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* List Column */}
                <div className={`col-span-1 lg:col-span-7 ${editingListing ? "hidden lg:block" : "lg:col-span-12"}`}>
                  <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search listings by name, category, or address..." 
                        className="pl-9 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" className="rounded-xl flex items-center gap-2" asChild>
                      <Link to="/">
                        <Plus className="h-4 w-4" /> New Page
                      </Link>
                    </Button>
                  </div>

                  {loading ? (
                    <div className="py-10 text-center text-muted-foreground">Loading listings...</div>
                  ) : filteredListings.length === 0 ? (
                    <div className="card-tint-blue rounded-2xl border border-border/50 p-10 text-center">
                      <ShieldAlert className="h-10 w-10 text-brand-blue/60 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No listings found matching your search.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {filteredListings.map((listing) => (
                        <div 
                          key={listing.id}
                          className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                            editingListing?.id === listing.id 
                              ? "border-brand-blue bg-brand-blue/5 shadow-md" 
                              : "border-border bg-card hover:shadow-soft"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-lg text-foreground truncate">{listing.name}</h3>
                              {listing.category && (
                                <span className="bg-secondary text-[11px] font-semibold text-muted-foreground px-2.5 py-0.5 rounded-full">
                                  {listing.category}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-brand-blue mt-1">/l/{listing.slug}</p>
                            
                            <div className="flex flex-col gap-1 mt-3">
                              {listing.formatted_address && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 text-brand-blue" />
                                  <span className="truncate">{listing.formatted_address}</span>
                                </div>
                              )}
                              {listing.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3 text-brand-blue" />
                                  <span>{listing.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 self-stretch md:self-auto justify-end border-t md:border-t-0 border-border pt-3 md:pt-0">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="rounded-xl text-brand-blue hover:bg-brand-blue/10 flex items-center gap-1.5"
                              onClick={() => handleEditClick(listing)}
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="rounded-xl text-foreground hover:bg-secondary flex items-center gap-1.5"
                              asChild
                            >
                              <Link to={`/l/${listing.slug}`} target="_blank">
                                <Globe className="h-3.5 w-3.5" /> View
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="rounded-xl text-destructive hover:bg-destructive/10 flex items-center gap-1.5"
                              onClick={() => handleDeleteListing(listing.id, listing.name)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Editing Form Column */}
                {editingListing && (
                  <div className="col-span-1 lg:col-span-5 bg-card border border-border rounded-3xl p-6 shadow-soft animate-in slide-in-from-right-5 duration-300">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-foreground">Edit Listing Details</h2>
                      <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setEditingListing(null)}>Cancel</Button>
                    </div>

                    <form onSubmit={handleSaveListing} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Business Name</label>
                        <div className="relative">
                          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/50" />
                          <Input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="pl-9 rounded-xl"
                            placeholder="e.g. Tulips Hospital"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">URL Slug</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">/l/</span>
                          <Input 
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            className="pl-8 rounded-xl font-mono"
                            placeholder="slug-name-here"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">Category</label>
                          <div className="relative">
                            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/50" />
                            <Input 
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="pl-9 rounded-xl text-xs"
                              placeholder="Category"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/50" />
                            <Input 
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="pl-9 rounded-xl text-xs"
                              placeholder="Phone Number"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Website URL</label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/50" />
                          <Input 
                            value={editWebsite}
                            onChange={(e) => setEditWebsite(e.target.value)}
                            className="pl-9 rounded-xl text-xs"
                            placeholder="Website URL"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/50" />
                          <Input 
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="pl-9 rounded-xl text-xs"
                            placeholder="Formatted Address"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">Editorial Summary / Bio</label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 h-4 w-4 text-brand-blue/50" />
                          <Textarea 
                            value={editSummary}
                            onChange={(e) => setEditSummary(e.target.value)}
                            className="pl-9 rounded-xl min-h-[100px] text-xs pt-3"
                            placeholder="Enter brief description of the company..."
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full btn-gradient border-0 text-white shadow-md hover:shadow-lg rounded-xl mt-4" disabled={saving}>
                        {saving ? "Saving Changes..." : "Update Listing"}
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-3xl bg-card border border-border rounded-3xl p-8 shadow-soft">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-blue" />
                  Storefries Branding & Settings
                </h2>
                <p className="text-muted-foreground text-sm mb-6">Customize the look and feel of your storefront applications dynamically.</p>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Storefront Title Name</label>
                      <Input placeholder="Storefries Listing" defaultValue="Storefries Listing" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Logo Image Link</label>
                      <Input placeholder="https://..." defaultValue="/logo.png" className="rounded-xl" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Google Maps API Key</label>
                    <Input type="password" value="****************************************" disabled className="rounded-xl" />
                    <span className="text-[10px] text-muted-foreground mt-1 block">To edit your API secrets, please use your Lovable secrets panel.</span>
                  </div>

                  <Button className="btn-gradient border-0 text-white rounded-xl px-6" onClick={() => toast.success("Global settings saved successfully!")}>
                    Save Settings
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      
      <SiteFooter />
    </div>
  );
};

export default Admin;
