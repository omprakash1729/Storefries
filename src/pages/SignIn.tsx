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
import { LogIn, UserPlus, Key, Mail, Chrome, Loader2 } from "lucide-react";

const SignIn = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("prakash04082002@gmail.com");
  const [password, setPassword] = useState("pwd4DEVELOPER@1729");

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/generate");
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
        navigate("/generate");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/generate`,
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Successfully registered! You can now log in.");
        setIsSignUp(false);
      } else {
        // Safe Developer Auto-Signup / Self-Healing Fallback
        let signInErr: any = null;
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) signInErr = error;
        } catch (err: any) {
          signInErr = err;
        }

        // If login failed because the account is not in Supabase, auto-create it
        if (signInErr && 
            email === "prakash04082002@gmail.com" && 
            password === "pwd4DEVELOPER@1729" && 
            (signInErr.message?.toLowerCase().includes("invalid login credentials") || 
             signInErr.message?.toLowerCase().includes("invalid credentials"))
        ) {
          toast.info("Auto-registering developer credentials in Supabase...");
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          if (signUpError) throw signUpError;

          // Re-attempt sign in now that it is registered
          const { error: reSignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (reSignInError) throw reSignInError;
          
          toast.success("Developer account auto-created and logged in!");
        } else if (signInErr) {
          throw signInErr;
        } else {
          toast.success("Welcome back! Redirecting...");
        }

        navigate("/generate");
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

            {/* Google Authentication Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full py-6 rounded-2xl font-bold flex items-center justify-center gap-3 border-border hover:bg-secondary/40 transition-all duration-300 shadow-sm relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Chrome className="h-5 w-5 text-brand-blue fill-brand-blue/10 flex-shrink-0" />
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
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="rounded-xl border-border bg-background py-5 focus-visible:ring-brand-blue shadow-sm"
                  required
                />
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
