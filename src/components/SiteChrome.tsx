import { Link, useLocation } from "react-router-dom";

export const SiteHeader = () => {
  const { pathname } = useLocation();
  return (
    <header className="border-b border-border bg-background">
      <div className="container flex h-24 items-center justify-between">
        <Link to="/" className="flex items-center h-full w-[250px]">
          <img src="/logo.png" alt="Storefries Logo" className="h-full py-2 w-auto object-contain scale-[2.5] origin-left ml-4" />
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
