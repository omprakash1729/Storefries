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
import Leads from "./pages/Leads";
import Listing from "./pages/Listing";
import Listings from "./pages/Listings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const hostname = window.location.hostname;
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
    // Assumes base domain is 2 parts (storefries.com), so 3 parts means subdomain
    else if (parts.length >= 3) {
       setSubdomain(parts[0]);
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
        <Route path="/leads" element={<Leads />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/l/:slug" element={<Listing />} />
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
          <AppContent />
        </TooltipProvider>
      </HelmetProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
