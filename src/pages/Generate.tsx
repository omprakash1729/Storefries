import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { motion } from "framer-motion";
import { SoftAurora } from "@/components/SoftAurora";
import { Search, Loader2 } from "lucide-react";

const Generate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");

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

    setLoading(true);
    try {
      const { data: genData, error: genError } = await supabase.functions.invoke("generate-listing", {
        body: { url: url.trim() },
      });
      
      if (genError) {
        let errorMsg = genError.message;
        try {
          if (genError.context && typeof genError.context.json === 'function') {
            const realError = await genError.context.json().catch(() => null);
            if (realError?.error) errorMsg = realError.error;
          }
        } catch (e) {
          // ignore parsing error
        }
        throw new Error(errorMsg);
      }
      if (!genData?.slug) throw new Error(genData?.error ?? "Failed to generate page. Please check your internet or try again.");

      toast.success(genData.cached ? "Loaded existing premium landing page!" : "Premium landing page generated successfully!");
      navigate(`/l/${genData.slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate. Ensure the place is fully listed on Google Maps.");
    } finally {
      setLoading(false);
    }
  };

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
      <Seo title="Generate Premium Page - Storefries Listing" description="Paste a Google Maps link to instantly generate a premium landing page." />
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center py-20 px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-card dark:glass-card-dark border border-border/50 dark:border-white/10 rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Paste Google Maps URL</h1>
            <p className="text-muted-foreground text-sm font-medium">We'll use this to fetch your business details and build your premium landing page instantly.</p>
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
            <Button type="submit" className="w-full h-14 rounded-xl font-bold text-base btn-gradient text-white border-0 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating Page...</span>
                </>
              ) : (
                <span>Generate</span>
              )}
            </Button>
          </form>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Generate;
