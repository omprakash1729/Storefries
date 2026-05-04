import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { photoUrl } from "@/lib/photo";
import { Star, MapPin, Phone, Globe, Clock, Tag } from "lucide-react";

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

      <main className="flex-1">
        {/* Hero */}
        <section className="container py-12 md:py-16 animate-fade-in">
          {listing.category && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {listing.category}
            </p>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{listing.name}</h1>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {listing.rating != null && (
              <div className="flex items-center gap-2">
                <Stars value={listing.rating} />
                <span className="font-semibold">{listing.rating}</span>
                <span className="text-muted-foreground">({listing.user_ratings_total ?? 0} reviews)</span>
              </div>
            )}
            {listing.formatted_address && (
              <address className="not-italic flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{listing.formatted_address}</span>
              </address>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {listing.phone && (
              <Button asChild variant="cta" size="lg">
                <a href={`tel:${listing.phone}`}><Phone /> Call</a>
              </Button>
            )}
            <Button asChild variant="cta" size="lg">
              <a href={mapsLink} target="_blank" rel="noopener noreferrer"><MapPin /> Directions</a>
            </Button>
            {listing.website && (
              <Button asChild variant="outline" size="lg">
                <a href={listing.website} target="_blank" rel="noopener noreferrer"><Globe /> Website</a>
              </Button>
            )}
          </div>
        </section>

        {/* Gallery */}
        {photos.length > 0 && (
          <section className="container pb-12">
            <h2 className="text-2xl font-bold mb-6">Gallery</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {photos.slice(0, 8).map((p, i) => (
                <div
                  key={p.name}
                  className={`overflow-hidden rounded-2xl border border-border shadow-soft bg-secondary ${i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-square"}`}
                >
                  <img
                    src={photoUrl(p.name, i === 0 ? 1200 : 600)}
                    alt={`${listing.name} photo ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Details Card */}
        <section className="container pb-12">
          <div className="card-tint-blue rounded-2xl p-6 md:p-8 shadow-soft border border-border/50">
            <h2 className="text-2xl font-bold mb-6">Business Details</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {listing.phone && (
                <Detail icon={Phone} label="Phone" value={<a href={`tel:${listing.phone}`} className="hover:text-brand-blue">{listing.phone}</a>} />
              )}
              {listing.website && (
                <Detail
                  icon={Globe}
                  label="Website"
                  value={
                    <a href={listing.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand-blue truncate block">
                      {listing.website.replace(/^https?:\/\//, "")}
                    </a>
                  }
                />
              )}
              {listing.category && <Detail icon={Tag} label="Category" value={listing.category} />}
              {listing.formatted_address && <Detail icon={MapPin} label="Address" value={listing.formatted_address} />}
              {hours && (
                <div className="md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-brand-blue" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 font-semibold">Hours</p>
                      <ul className="space-y-1 text-sm">
                        {hours.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="container pb-12">
          <h2 className="text-2xl font-bold mb-6">Location</h2>
          <div className="overflow-hidden rounded-2xl border border-border shadow-soft bg-background">
            <iframe
              title={`Map of ${listing.name}`}
              src={embedSrc}
              className="w-full h-[400px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="container pb-12">
            <h2 className="text-2xl font-bold mb-6">Reviews</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.slice(0, 6).map((r, i) => (
                <article key={i} className="rounded-2xl bg-card border border-border shadow-soft p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {r.authorAttribution?.photoUri ? (
                      <img
                        src={r.authorAttribution.photoUri}
                        alt={r.authorAttribution.displayName ?? "Reviewer"}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{r.authorAttribution?.displayName ?? "Anonymous"}</p>
                      <div className="flex items-center gap-2">
                        {r.rating != null && <Stars value={r.rating} />}
                        {r.relativePublishTimeDescription && (
                          <span className="text-xs text-muted-foreground">{r.relativePublishTimeDescription}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {r.text?.text && (
                    <p className="text-sm text-foreground leading-relaxed line-clamp-6">{r.text.text}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {listing.editorial_summary && (
          <section className="container pb-12">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-foreground leading-relaxed max-w-3xl">{listing.editorial_summary}</p>
          </section>
        )}

        {/* CTA */}
        <section className="container py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Visit {listing.name}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Get directions or give them a call right now.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {listing.phone && (
              <Button asChild variant="cta" size="lg">
                <a href={`tel:${listing.phone}`}><Phone /> Call now</a>
              </Button>
            )}
            <Button asChild variant="cta" size="lg">
              <a href={mapsLink} target="_blank" rel="noopener noreferrer"><MapPin /> Get directions</a>
            </Button>
          </div>
        </section>
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
