import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, UserPlus, Key, Mail, Chrome, Loader2, User, Building2, Phone, Eye, EyeOff } from "lucide-react";

// Google G Logo SVG Component
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

const SignIn = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("prakash04082002@gmail.com");
  const [password, setPassword] = useState("pwd4DEVELOPER@1729");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [pendingName, setPendingName] = useState<string | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const claimName = localStorage.getItem("storefries_pending_name");
    const claimSlug = localStorage.getItem("storefries_pending_slug");
    if (claimName) {
      setPendingName(claimName);
      setPendingSlug(claimSlug);
      setIsSignUp(true);
      // Clear presets for claiming user
      setEmail("");
      setPassword("");
    }
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const redirectBack = localStorage.getItem("storefries_redirect_back_url");
          if (redirectBack) {
            navigate(redirectBack);
          } else {
            navigate("/generate");
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const redirectBack = localStorage.getItem("storefries_redirect_back_url");
        if (redirectBack) {
          navigate(redirectBack);
        } else {
          navigate("/generate");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const redirectUrl = localStorage.getItem("storefries_redirect_back_url") || "/generate";
      const pendingUrl = localStorage.getItem("storefries_pending_url");

      if (pendingUrl) {
        if (!name || !company) {
          toast.error("Please enter your Name and Company Name before continuing with Google to publish the page.");
          return;
        }

        // Cache lead details so they can be read post-login in processPendingClaim
        localStorage.setItem(
          "storefries_pending_lead",
          JSON.stringify({
            name,
            email: "",
            company,
            phone: phone || "",
            google_maps_url: pendingUrl,
            slug: pendingSlug
          })
        );
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${redirectUrl}`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate Google sign-in.");
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name || !company) {
          toast.error("Please enter your Name and Company Name.");
          setLoading(false);
          return;
        }

        const pendingUrl = localStorage.getItem("storefries_pending_url");
        if (pendingUrl) {
          localStorage.setItem(
            "storefries_pending_lead",
            JSON.stringify({
              name,
              email,
              company,
              phone: phone || "",
              google_maps_url: pendingUrl,
              slug: pendingSlug
            })
          );
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              company,
              phone
            }
          }
        });
        if (error) throw error;

        // Also insert lead directly
        const listingUrl = pendingSlug ? `${window.location.origin}/place/${pendingSlug}` : null;
        const leadPayload: any = {
          name,
          email,
          phone: phone || null,
          company,
          user_id: data.user?.id || null,
          google_maps_url: pendingUrl || null,
          listing_url: listingUrl
        };

        let { error: leadErr } = await supabase.from("leads").insert([leadPayload]);
        
        if (leadErr) {
          console.warn("Direct lead insert with listing_url failed, trying fallback:", leadErr);
          const fallbackCompany = listingUrl ? `${company} [Listing URL: ${listingUrl}]` : company;
          const { error: fallbackErr } = await supabase.from("leads").insert([{
            name,
            email,
            phone: phone || null,
            company: fallbackCompany,
            user_id: data.user?.id || null,
            google_maps_url: pendingUrl || null
          }]);
          if (fallbackErr) {
            console.error("Direct lead insert fallback error:", fallbackErr);
          }
        }

        // If Supabase automatically logs the user in (Email confirmation is OFF)
        if (data.session) {
          toast.success("Account created successfully! Redirecting...");
          const redirectBack = localStorage.getItem("storefries_redirect_back_url");
          if (redirectBack) {
            navigate(redirectBack);
          } else {
            navigate("/generate");
          }
          return;
        }

        toast.success("Successfully registered! You can now log in.");
        setIsSignUp(false);
      } else {
        // Safe Developer Auto-Signup / Self-Healing Fallback
        let signInErr: any = null;
        let signInData: any = null;
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) signInErr = error;
          else signInData = data;
        } catch (err: any) {
          signInErr = err;
        }

        // If login failed because the account is not in Supabase, auto-create it
        if (signInErr && 
            email === "prakash04082002@gmail.com" && 
            password === "pwd4DEVELOPER@1729"
        ) {
          toast.info("Auto-registering developer credentials in Supabase...");
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          if (signUpError) throw signUpError;

          // Re-attempt sign in now that it is registered
          const { data: reSignInData, error: reSignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (reSignInError) {
            if (reSignInError.message?.toLowerCase().includes("email not confirmed") || 
                reSignInError.message?.toLowerCase().includes("confirmation")) {
              toast.error(
                "Developer account auto-registered! However, 'Email Confirmation' is active in your Supabase project. To log in instantly, go to your Supabase Dashboard -> Authentication -> Providers -> Email and turn OFF 'Confirm email'.",
                { duration: 10000 }
              );
              return;
            }
            throw reSignInError;
          }
          
          signInData = reSignInData;
          toast.success("Developer account auto-created and logged in!");
        } else if (signInErr) {
          if (signInErr.message === "Invalid login credentials") {
            // Automatically switch them to the Sign Up tab if they likely don't have an account
            setIsSignUp(true);
            throw new Error("We couldn't find an account with that password. If you are new, please fill in your details to Sign Up!");
          }
          throw signInErr;
        } else {
          toast.success("Welcome back! Redirecting...");
        }

        if (signInData?.session) {
          const redirectBack = localStorage.getItem("storefries_redirect_back_url");
          if (redirectBack) {
            navigate(redirectBack);
          } else {
            navigate("/generate");
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
        <p className="mt-4 text-muted-foreground font-semibold">Verifying secure session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Dynamic Aurora Glow Backdrops */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-brand-blue/5 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-[#8b5cf6]/5 rounded-full blur-[150px] pointer-events-none z-0" />

      <Seo title="Sign In - Storefries Listing Creator" description="Sign in to your Storefries account to generate high-performing business landing pages." />
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center py-16 px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="bg-card/85 dark:bg-black/40 border border-border/80 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl shadow-brand-blue/5 relative overflow-hidden">
            
            {pendingName && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-blue/15 via-[#8b5cf6]/10 to-[#00ff54]/5 border border-brand-blue/20 text-foreground text-xs leading-relaxed font-semibold shadow-sm animate-pulse">
                <span className="text-brand-blue font-extrabold uppercase tracking-wider block mb-1">Publishing Setup</span>
                You are publishing <span className="text-brand-blue font-bold underline decoration-brand-blue/30">{pendingName}</span>. Please register below to publish this page to your account.
              </div>
            )}

            {/* Top Branding/Subtitle */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                {isSignUp ? "Create an Account" : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground text-sm mt-2 font-medium">
                {isSignUp 
                  ? "Sign up to create and publish premium local business pages." 
                  : "Sign in to manage and generate high-end landing pages."
                }
              </p>
            </div>

            {/* Publisher Metadata Fields (Name, Company, Phone) - Rendered at top ONLY if publishing setup is active */}
            {pendingName && (
              <div className="space-y-4 mb-6 p-5 rounded-2xl border border-border/60 bg-muted/30 backdrop-blur-md shadow-inner">
                <h3 className="text-xs font-extrabold text-brand-blue uppercase tracking-wider mb-2">Publisher Profile</h3>
                
                <div className="space-y-1.5">
                  <Label htmlFor="pub-name" className="font-extrabold text-[11px] tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> Your Name *
                  </Label>
                  <Input
                    id="pub-name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border-border bg-background py-4 text-sm focus-visible:ring-brand-blue shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pub-company" className="font-extrabold text-[11px] tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Company Name *
                  </Label>
                  <Input
                    id="pub-company"
                    placeholder="Business Name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border-border bg-background py-4 text-sm focus-visible:ring-brand-blue shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pub-phone" className="font-extrabold text-[11px] tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number (Optional)
                  </Label>
                  <Input
                    id="pub-phone"
                    placeholder="+91 6374392488"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border-border bg-background py-4 text-sm focus-visible:ring-brand-blue shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Google Authentication Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full py-6 rounded-2xl font-bold flex items-center justify-center gap-3 border-border hover:bg-secondary/40 transition-all duration-300 shadow-sm relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <GoogleLogo />
              <span>Continue with Google</span>
            </Button>

            {/* Visual Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/80"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card dark:bg-[#0c0d0e] px-4 text-muted-foreground font-bold tracking-wider">
                  or use email
                </span>
              </div>
            </div>

            {/* Email / Password Sign In Form */}
            <form onSubmit={handleAuthAction} className="space-y-5">
              {/* Only show Name, Company, Phone here if registering normally (NOT in publication setup flow) */}
              {isSignUp && !pendingName && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-extrabold text-xs tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> Your Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border-border bg-background py-5 focus-visible:ring-brand-blue shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="font-extrabold text-xs tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Company Name *
                    </Label>
                    <Input
                      id="company"
                      placeholder="Business Name"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border-border bg-background py-5 focus-visible:ring-brand-blue shadow-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-extrabold text-xs tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number (Optional)
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+91 6374392488"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      className="rounded-xl border-border bg-background py-5 focus-visible:ring-brand-blue shadow-sm"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="font-extrabold text-xs tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="rounded-xl border-border bg-background py-5 focus-visible:ring-brand-blue shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-extrabold text-xs tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" /> Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border-border bg-background py-5 pr-10 focus-visible:ring-brand-blue shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none bg-transparent border-0 p-0 hover:scale-105 active:scale-95 transition-transform duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 rounded-2xl font-bold bg-brand-blue text-white shadow-lg shadow-brand-blue/15 hover:shadow-brand-blue/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Create Account</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Sign Up / Log In */}
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={loading}
                className="text-xs font-bold text-brand-blue hover:underline transition-all"
              >
                {isSignUp 
                  ? "Already have an account? Sign In" 
                  : "Don't have an account? Sign Up now"
                }
              </button>
            </div>

          </div>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default SignIn;
