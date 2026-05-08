import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Search, Sparkles, Globe, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please paste a Google Maps URL");
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data, error } = await supabase.functions.invoke("generate-listing", {
        body: { url: url.trim(), userId: userId || null },
      });
      if (error) {
        // Supabase edge function errors sometimes hide the real message in context
        const realError = await error.context?.json().catch(() => null);
        throw new Error(realError?.error || error.message);
      }
      if (!data?.slug) throw new Error(data?.error ?? "Failed to generate");
      toast.success(data.cached ? "Loaded existing listing" : "Listing generated!");
      navigate(`/l/${data.slug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title="Storefries Listing — Generate business landing pages from Google Maps"
        description="Paste a Google Maps link and instantly generate a clean, SEO-friendly landing page for any local business."
      />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="container py-20 md:py-28 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-medium text-foreground mb-6">
            <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
            Powered by Google Places
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">
            Beautiful business pages in seconds
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Paste a Google Maps link and generate a clean, SEO-friendly landing page for any local business.
          </p>

          <form onSubmit={onSubmit} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="pl-9 h-12 text-base"
                disabled={loading}
              />
            </div>
            <Button type="submit" variant="cta" size="lg" disabled={loading} className="h-12 px-8">
              {loading ? "Generating..." : "Generate Page"}
            </Button>
          </form>
        </section>

        {/* How it works */}
        <section className="container pb-24">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">How it works</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Search, title: "Paste a URL", desc: "Drop in a Google Maps or Business Profile link." },
              { icon: Zap, title: "Auto-fetch", desc: "We pull photos, hours, reviews, and details." },
              { icon: Globe, title: "Share it", desc: "Get a clean, SEO-friendly landing page instantly." },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="card-tint-blue rounded-2xl p-6 shadow-soft border border-border/50"
              >
                <div className="h-10 w-10 rounded-lg btn-gradient flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
