import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { motion, AnimatePresence } from "framer-motion";
import { SoftAurora } from "@/components/SoftAurora";
import { Search, Loader2, ArrowLeft } from "lucide-react";

const Generate = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"url" | "lead">("url");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // URL Form State
  const [url, setUrl] = useState("");

  // Lead Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: ""
  });

  // Check pending states on load
  useEffect(() => {
    const loadPendingData = async () => {
      try {
        const pendingUrl = localStorage.getItem("storefries_pending_url");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (pendingUrl && session) {
          // If they just signed in, restore the URL, transition to lead details, and clear from storage immediately
          setUrl(pendingUrl);
          setStep("lead");
          // Prefill email if available
          if (session.user?.email) {
            setFormData(prev => ({
              ...prev,
              email: session.user.email || ""
            }));
          }
          localStorage.removeItem("storefries_pending_url");
        } else {
          // Otherwise, clear old cache so the input remains perfectly clean and empty
          localStorage.removeItem("storefries_pending_url");
        }
      } catch (err) {
        console.error("Error loading pending state:", err);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    loadPendingData();
  }, []);

  // Step 1: Submit Google Maps URL
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please paste a Google Maps URL");
      return;
    }
    
    // Check if the URL looks like a google maps link
    if (
      !url.includes("google.com/maps") && 
      !url.includes("maps.app.goo.gl") && 
      !url.includes("goo.gl/maps")
    ) {
      toast.error("Please paste a valid Google Maps or maps.app.goo.gl link");
      return;
    }

    // Save pending URL to local storage to preserve state across authentication redirects
    localStorage.setItem("storefries_pending_url", url.trim());

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.info("Pasted URL saved! Please sign in to fill out listing details and generate.");
      navigate("/signin");
      return;
    }

    // If authenticated, move directly to step 2 (Lead Form)
    setStep("lead");
  };

  // Step 2: Submit Lead Form and Trigger Generation
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        toast.error("Your session has expired. Please sign in again.");
        navigate("/signin");
        return;
      }

      // 1. Invoke Google Places API / serpapi listing generation backend Edge Function
      const { data: genData, error: genError } = await supabase.functions.invoke("generate-listing", {
        body: { url: url.trim(), userId: userId },
      });
      
      if (genError) {
        const realError = await genError.context?.json().catch(() => null);
        throw new Error(realError?.error || genError.message);
      }
      if (!genData?.slug) throw new Error(genData?.error ?? "Failed to generate page. Please check your internet or try again.");

      // 2. Log captured lead with the listing maps url & creator user_id
      const { error: leadErr } = await supabase.from('leads').insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company,
          user_id: userId,
          google_maps_url: url.trim()
        }
      ]);

      // Clear pending URL upon successful generation
      localStorage.removeItem("storefries_pending_url");
      
      if (leadErr) {
        console.error("Lead saving error:", leadErr);
        toast.info("Landing page successfully created! (Note: lead logging database issue occurred)");
      } else {
        toast.success(genData.cached ? "Loaded existing business listing!" : "Premium landing page generated successfully!");
      }
      
      // Navigate to detailed visual listing slug
      navigate(`/l/${genData.slug}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate. Ensure the place is fully listed on Google Maps.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
        <p className="mt-4 text-muted-foreground font-semibold">Verifying secure session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden text-foreground transition-colors duration-300">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <SoftAurora
          speed={0.6}
          scale={1.5}
          brightness={1}
          color1="#0077ff"
          color2="#00ff54"
          noiseFrequency={3}
          noiseAmplitude={1}
          bandHeight={0.5}
          bandSpread={1.3}
          octaveDecay={0.22}
          layerOffset={0.3}
          colorSpeed={1}
          enableMouseInteraction
          mouseInfluence={0.25}
        />
      </div>
      <Seo title="Get Started - Storefries Listing" description="Enter your details to generate your landing page." />
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center py-20 px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-card dark:glass-card-dark border border-border/50 dark:border-white/10 rounded-2xl shadow-xl p-8"
        >
          <AnimatePresence mode="wait">
            {step === "url" ? (
              <motion.div 
                key="url-step"
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2">Paste Google Maps URL</h1>
                  <p className="text-muted-foreground text-sm">We'll use this to fetch your business details and build your premium listing page.</p>
                </div>
                <form onSubmit={handleUrlSubmit} className="space-y-6">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-brand-blue transition-colors" />
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://maps.app.goo.gl/..."
                      className="pl-12 h-14 text-base bg-background/50 dark:bg-black/40 border-border dark:border-white/10 rounded-xl backdrop-blur-md"
                      disabled={loading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-xl font-bold text-base btn-gradient text-white border-0">
                    Generate
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                key="lead-step"
                initial={{ opacity: 0, x: 10 }} 
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">Almost There!</h1>
                  <p className="text-muted-foreground text-sm">Enter your contact details to link and generate your premium landing page.</p>
                </div>
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input 
                      id="name" required 
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-background/50 dark:bg-black/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input 
                      id="email" type="email" required 
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-background/50 dark:bg-black/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name *</Label>
                    <Input 
                      id="company" required 
                      value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="bg-background/50 dark:bg-black/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input 
                      id="phone" type="tel" 
                      value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-background/50 dark:bg-black/40"
                    />
                  </div>
                  
                  <div className="pt-2 space-y-3">
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold text-base btn-gradient text-white border-0 flex items-center justify-center gap-2" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Generating Page...</span>
                        </>
                      ) : (
                        <span>Generate Landing Page</span>
                      )}
                    </Button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        // Clear pending URL and back to URL step
                        localStorage.removeItem("storefries_pending_url");
                        setStep("url");
                      }}
                      className="w-full py-2.5 text-xs text-muted-foreground font-bold hover:text-foreground hover:underline transition-all flex items-center justify-center gap-1.5"
                      disabled={loading}
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Change Google Maps URL</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Generate;
