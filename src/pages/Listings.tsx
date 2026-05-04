import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Star, MapPin } from "lucide-react";

interface Row {
  slug: string;
  name: string;
  formatted_address: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  category: string | null;
}

const Listings = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("listings")
      .select("slug,name,formatted_address,rating,user_ratings_total,category")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo title="Browse Listings | Storefries" description="Browse all generated business landing pages." />
      <SiteHeader />
      <main className="flex-1 container py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Browse listings</h1>
        <p className="text-muted-foreground mb-8">All businesses generated with Storefries.</p>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <div className="card-tint-blue rounded-2xl p-10 text-center border border-border/50">
            <p className="text-muted-foreground">No listings yet. <Link to="/" className="text-brand-blue font-medium">Generate one</Link>.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <Link
                key={r.slug}
                to={`/l/${r.slug}`}
                className="block rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-card transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{r.name}</h3>
                {r.category && (
                  <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">{r.category}</p>
                )}
                {r.rating != null && (
                  <div className="flex items-center gap-1 text-sm mb-2">
                    <Star className="h-3.5 w-3.5 fill-brand-blue text-brand-blue" />
                    <span className="font-medium">{r.rating}</span>
                    <span className="text-muted-foreground">({r.user_ratings_total ?? 0})</span>
                  </div>
                )}
                {r.formatted_address && (
                  <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{r.formatted_address}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Listings;
