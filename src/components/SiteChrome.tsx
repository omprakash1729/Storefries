import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const SiteHeader = () => {
  const { pathname } = useLocation();
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/generate`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate Google Sign-In");
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Successfully signed out!");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out");
    }
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email;

  return (
    <header className="border-b border-border bg-background">
      <div className="container flex h-24 items-center justify-between">
        <Link to="/" className="flex items-center h-full w-[250px]">
          <img src="/logo.png" alt="Storefries Logo" className="h-full py-2 w-auto object-contain scale-[2.5] origin-left ml-4 dark:hidden" />
          <img src="/logo-dark.png" alt="Storefries Logo" className="h-full py-2 w-auto object-contain scale-[2.5] origin-left ml-4 hidden dark:block" />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className={pathname === "/" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}
          >
            Home
          </Link>
          <Link
            to="/generate"
            className={pathname === "/generate" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}
          >
            Generate
          </Link>
          <Link
            to="/listings"
            className={pathname === "/listings" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}
          >
            Browse
          </Link>
          <Link
            to="/contact"
            className={pathname === "/contact" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}
          >
            Contact
          </Link>

          {!authLoading && (
            user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-border/80">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || "User Avatar"}
                    className="h-8 w-8 rounded-full border border-border/50 object-cover shadow-sm"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-xs flex items-center justify-center border border-border/50">
                    {fullName?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-muted-foreground max-w-[100px] truncate hidden md:inline-block">
                  {fullName}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={handleSignOut}
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link to="/signin">
                <Button
                  variant="outline"
                  className="h-9 px-4 rounded-xl text-xs font-bold border-border hover:bg-secondary/40 transition-all duration-300"
                >
                  Sign In
                </Button>
              </Link>
            )
          )}
          <ThemeToggle />
        </nav>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-4">
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-foreground hover:bg-transparent">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] flex flex-col justify-between p-6">
              <div className="flex flex-col gap-6">
                <SheetHeader className="text-left border-b border-border pb-4">
                  <SheetTitle className="text-lg font-bold text-brand-blue">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4">
                  <Link
                    to="/"
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-semibold py-2 border-b border-border/40 transition-colors ${pathname === "/" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/generate"
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-semibold py-2 border-b border-border/40 transition-colors ${pathname === "/generate" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}`}
                  >
                    Generate
                  </Link>
                  <Link
                    to="/listings"
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-semibold py-2 border-b border-border/40 transition-colors ${pathname === "/listings" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}`}
                  >
                    Browse
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-semibold py-2 border-b border-border/40 transition-colors ${pathname === "/contact" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}`}
                  >
                    Contact
                  </Link>
                </nav>
              </div>

              <div className="border-t border-border pt-6 mt-auto">
                {!authLoading && (
                  user ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={fullName || "User Avatar"}
                            className="h-10 w-10 rounded-full border border-border/50 object-cover shadow-sm"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-brand-blue/10 text-brand-blue font-bold text-sm flex items-center justify-center border border-border/50">
                            {fullName?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {fullName}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => {
                          setIsOpen(false);
                          handleSignOut();
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link to="/signin" onClick={() => setIsOpen(false)}>
                      <Button
                        className="w-full h-11 rounded-xl text-sm font-bold btn-gradient border-0 text-white shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Sign In
                      </Button>
                    </Link>
                  )
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export const SiteFooter = () => (
  <footer className="border-t border-white/10 mt-24 bg-gradient-to-b from-[#031c36] to-[#010f1e] text-white relative z-10 overflow-hidden">
    {/* Decorative background glow blobs */}
    <div className="absolute top-0 left-1/4 w-[350px] h-[350px] bg-brand-blue/15 blur-[120px] rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />
    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#6edb48]/10 blur-[130px] rounded-full pointer-events-none translate-x-1/2 translate-y-1/2" />

    <div className="container mx-auto px-6 pt-16 pb-8 relative z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pb-10 border-b border-white/10">
        
        {/* Column 1: Brand & Info */}
        <div className="flex flex-col gap-5 text-left">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <img src="/favicon.png" alt="Storefries Icon" className="h-full w-auto object-contain" />
            </div>
            <h3 className="text-lg font-black tracking-tight text-white m-0 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Storefries Listing
            </h3>
          </div>
          <p className="text-sm text-white/60 leading-relaxed max-w-sm">
            Generate beautiful, interactive business landing pages directly from Google Maps links. Build your local presence effortlessly.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a 
              href="https://www.facebook.com/people/Storefries/100077974131077/#" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2.5 rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-[#6edb48] hover:to-[#0073c8] text-white/80 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,115,200,0.4)] border border-white/5 hover:border-transparent" 
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a 
              href="https://x.com/Storefries1" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2.5 rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-[#6edb48] hover:to-[#0073c8] text-white/80 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,115,200,0.4)] border border-white/5 hover:border-transparent" 
              aria-label="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a 
              href="https://www.instagram.com/storefries/" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2.5 rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-[#6edb48] hover:to-[#0073c8] text-white/80 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,115,200,0.4)] border border-white/5 hover:border-transparent" 
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a 
              href="https://in.linkedin.com/company/storefries" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2.5 rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-[#6edb48] hover:to-[#0073c8] text-white/80 hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,115,200,0.4)] border border-white/5 hover:border-transparent" 
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Column 2: Products */}
        <div className="flex flex-col gap-5 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 pb-1 border-b border-white/5 w-fit">
            Products
          </h4>
          <ul className="flex flex-col gap-3 text-sm">
            <li>
              <a 
                href="https://storefries.com/social-engagement.html" 
                target="_blank" 
                rel="noreferrer" 
                className="group flex items-center gap-2 text-white/70 hover:text-[#6edb48] hover:translate-x-1.5 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#6edb48] transition-colors" />
                Listing Management
              </a>
            </li>
            <li>
              <a 
                href="https://storefries.com/social.html" 
                target="_blank" 
                rel="noreferrer" 
                className="group flex items-center gap-2 text-white/70 hover:text-[#6edb48] hover:translate-x-1.5 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#6edb48] transition-colors" />
                Social Media Management
              </a>
            </li>
            <li>
              <a 
                href="https://storefries.com/reviews.html" 
                target="_blank" 
                rel="noreferrer" 
                className="group flex items-center gap-2 text-white/70 hover:text-[#6edb48] hover:translate-x-1.5 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#6edb48] transition-colors" />
                Review Management
              </a>
            </li>
            <li>
              <a 
                href="https://storefries.com/geo-social-marketing.html" 
                target="_blank" 
                rel="noreferrer" 
                className="group flex items-center gap-2 text-white/70 hover:text-[#6edb48] hover:translate-x-1.5 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#6edb48] transition-colors" />
                Local SEO
              </a>
            </li>
            <li>
              <a 
                href="https://storefries.com/geo-social-marketing.html" 
                target="_blank" 
                rel="noreferrer" 
                className="group flex items-center gap-2 text-white/70 hover:text-[#6edb48] hover:translate-x-1.5 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#6edb48] transition-colors" />
                Reputation Management
              </a>
            </li>
            <li>
              <a 
                href="https://storefries.com/post-idea.html" 
                target="_blank" 
                rel="noreferrer" 
                className="group flex items-center gap-2 text-white/70 hover:text-[#6edb48] hover:translate-x-1.5 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#6edb48] transition-colors" />
                AI Brand Agent
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Navigation */}
        <div className="flex flex-col gap-5 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 pb-1 border-b border-white/5 w-fit">
            Navigation
          </h4>
          <ul className="flex flex-col gap-3 text-sm">
            <li>
              <Link 
                to="/" 
                className="group flex items-center gap-2 text-white/70 hover:text-[#0073c8] hover:translate-x-1.5 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#0073c8] transition-colors" />
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/generate" 
                className="group flex items-center gap-2 text-white/70 hover:text-[#0073c8] hover:translate-x-1.5 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#0073c8] transition-colors" />
                Generate
              </Link>
            </li>
            <li>
              <Link 
                to="/listings" 
                className="group flex items-center gap-2 text-white/70 hover:text-[#0073c8] hover:translate-x-1.5 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#0073c8] transition-colors" />
                Browse Listings
              </Link>
            </li>
            <li>
              <Link 
                to="/contact" 
                className="group flex items-center gap-2 text-white/70 hover:text-[#0073c8] hover:translate-x-1.5 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[#0073c8] transition-colors" />
                Support / Contact
              </Link>
            </li>
            <li className="pt-2 flex flex-col gap-2">
              <a 
                href="https://storefries.com/" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center justify-between gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-white transition-all duration-300 border border-white/5 hover:border-white/10 hover:shadow-lg w-full"
              >
                <span>Storefries.com</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
              <a 
                href="https://storefries.com/contactus.html" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center justify-between gap-2 px-4 py-2.5 btn-gradient border-0 text-white rounded-xl text-xs font-semibold hover:shadow-lg w-full"
              >
                <span>Contact Storefries</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Premium CTA Card */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-brand-blue/30 transition-all duration-500 shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#6edb48] to-[#0073c8] opacity-[0.03] blur-2xl rounded-full group-hover:opacity-[0.12] transition-opacity duration-500 pointer-events-none" />
            
            <h4 className="text-sm font-bold text-white tracking-wide">Ready to stand out?</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Instantly generate search-optimized, beautiful landing pages from Google Maps listings.
            </p>
            <Link to="/generate" className="w-full">
              <button className="w-full py-3 px-4 rounded-xl text-xs font-extrabold btn-gradient border-0 text-white shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2">
                Generate Landing Page
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Copyright */}
      <div className="mt-6 pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-white/40 gap-6 border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} Storefries. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a 
              href="https://storefries.com/terms.html" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-[#6edb48] transition-colors"
            >
              Terms & Conditions
            </a>
            <span className="text-white/15 hidden sm:inline">|</span>
            <a 
              href="https://storefries.com/privacy.html" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-[#6edb48] transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-white/15 hidden sm:inline">|</span>
            <a 
              href="https://storefries.com/gdpr.html" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-[#6edb48] transition-colors"
            >
              GDPR
            </a>
          </div>
        </div>
        <p className="flex items-center gap-1.5 hover:text-white/60 transition-colors cursor-default">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6edb48]" />
          Helping local businesses shine.
        </p>
      </div>
    </div>
  </footer>
);
