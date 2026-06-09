import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import Generate from "./pages/Generate";
import Listing from "./pages/Listing";
import Listings from "./pages/Listings";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
import { CookieConsent } from "@/components/CookieConsent";

const queryClient = new QueryClient();

const AppContent = () => {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
    
    const mainDomains = [
      'localhost', 
      'storefries.vercel.app', 
      'www.storefries.vercel.app',
      'storefries-listing.vercel.app',
      'www.storefries-listing.vercel.app'
      // Note: Add future custom domains (like storefries.com) here
    ];

    if (mainDomains.includes(hostname)) {
      setSubdomain(null);
    } else {
      const parts = hostname.split('.');
      
      // Ignore www prefix if present
      if (parts[0] === 'www') {
        parts.shift();
      }

      // Check for localhost subdomains (e.g., john.localhost)
      if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
         if (parts[0] !== 'localhost') {
             setSubdomain(parts[0]);
         }
      } 
      // Check for production subdomains (e.g., john.storefries.com)
      else if (parts.length >= 3) {
         setSubdomain(parts[0]);
      }
    }
    
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return null;
  }

  // If a valid subdomain is detected, only route to the published listing page
  if (subdomain) {
    return (
      <BrowserRouter>
         <Routes>
            <Route path="/*" element={<Listing subdomainSlug={subdomain} />} />
         </Routes>
      </BrowserRouter>
    );
  }

  // Otherwise, load the main application routes
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/generate" element={<Generate />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/l/:slug" element={<Listing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CookieConsent />
          <AppContent />
        </TooltipProvider>
      </HelmetProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
