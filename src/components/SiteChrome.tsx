import { Link, useLocation } from "react-router-dom";

export const SiteHeader = () => {
  const { pathname } = useLocation();
  return (
    <header className="border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md btn-gradient" />
          <span className="text-lg font-bold text-brand-blue">Storefries</span>
          <span className="text-sm font-medium text-muted-foreground">Listing</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className={pathname === "/" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}
          >
            Generate
          </Link>
          <Link
            to="/listings"
            className={pathname === "/listings" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}
          >
            Browse
          </Link>
        </nav>
      </div>
    </header>
  );
};

export const SiteFooter = () => (
  <footer className="border-t border-border bg-background mt-16">
    <div className="container py-8 text-sm text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
      <p>&copy; {new Date().getFullYear()} Storefries Listing</p>
      <p>Generate beautiful business landing pages from Google Maps.</p>
    </div>
  </footer>
);
