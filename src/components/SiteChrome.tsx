import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export const SiteHeader = () => {
  const { pathname } = useLocation();
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
          redirectTo: window.location.origin
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
              <Button
                size="sm"
                className="rounded-full bg-background border border-border/80 hover:bg-muted text-foreground font-medium shadow-sm hover:shadow transition-all duration-300 flex items-center gap-2 px-4 py-1.5"
                onClick={handleGoogleSignIn}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span className="text-xs">Sign In with Google</span>
              </Button>
            )
          )}
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
