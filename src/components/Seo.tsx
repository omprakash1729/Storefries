import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
}

export const Seo = ({ title, description, canonical, image, jsonLd }: SeoProps) => {
  const url = canonical ?? (typeof window !== "undefined" ? window.location.href : undefined);
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};
