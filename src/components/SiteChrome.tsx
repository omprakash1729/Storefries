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
            to="/leads"
            className={pathname === "/leads" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}
          >
            Leads
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
                    to="/leads"
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-semibold py-2 border-b border-border/40 transition-colors ${pathname === "/leads" ? "text-brand-blue" : "text-foreground hover:text-brand-blue"}`}
                  >
                    Leads
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
  <footer className="border-t border-border mt-16 bg-[#052749] text-white relative z-10">
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* Left: Brand & Tagline */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.png" alt="Storefries Icon" className="h-8 w-auto object-contain" />
            <h3 className="text-xl font-extrabold tracking-tight text-white">Storefries Listing</h3>
          </div>
          <p className="text-sm text-white/70 max-w-sm">
            Generate beautiful, interactive business landing pages directly from Google Maps.
          </p>
        </div>

        {/* Center: Main App Link */}
        <div className="flex items-center">
          <a 
            href="https://storefries.com/" 
            target="_blank" 
            rel="noreferrer" 
            className="group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm border border-white/5"
          >
            Our other application: Storefries.com
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>

        {/* Right: Socials */}
        <div className="flex items-center gap-3">
          <a href="https://www.facebook.com/people/Storefries/100077974131077/#" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all duration-300">
            <Facebook className="h-5 w-5" />
          </a>
          <a href="https://x.com/Storefries1" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all duration-300">
            <Twitter className="h-5 w-5" />
          </a>
          <a href="https://www.instagram.com/storefries/" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all duration-300">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="https://in.linkedin.com/company/storefries" target="_blank" rel="noreferrer" className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all duration-300">
            <Linkedin className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Bottom: Copyright */}
      <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-white/50">
        <p>&copy; {new Date().getFullYear()} Storefries. All rights reserved.</p>
      </div>
    </div>
  </footer>
);
