import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Shield, Check, X, Eye } from "lucide-react";

interface ConsentSettings {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<ConsentSettings>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if consent has already been given
    const savedConsent = localStorage.getItem("storefries_cookie_consent");
    if (!savedConsent) {
      // Delay showing the banner slightly for a smoother UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsedConsent = JSON.parse(savedConsent);
        // Apply cookies according to preferences
        applyConsent(parsedConsent);
      } catch (e) {
        setIsVisible(true);
      }
    }
  }, []);

  const applyConsent = (consent: ConsentSettings) => {
    // Save to localStorage
    localStorage.setItem("storefries_cookie_consent", JSON.stringify(consent));
    
    // In a real application, you would trigger/enable tracking codes here
    if (consent.analytics) {
      console.log("Analytics cookies enabled");
      // Load Google Analytics, etc.
    } else {
      console.log("Analytics cookies disabled");
      // Disable/unload tracking scripts
    }

    if (consent.marketing) {
      console.log("Marketing cookies enabled");
      // Load Facebook Pixel, etc.
    } else {
      console.log("Marketing cookies disabled");
      // Disable/unload marketing scripts
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    applyConsent(allAccepted);
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleAcceptEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(essentialOnly);
    applyConsent(essentialOnly);
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    applyConsent(preferences);
    setIsVisible(false);
    setShowPreferences(false);
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && !showPreferences && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 md:right-8 max-w-md w-[calc(100vw-3rem)] z-50 p-6 rounded-3xl bg-background/95 dark:bg-card/95 border border-border dark:border-white/10 shadow-2xl backdrop-blur-md flex flex-col gap-4 text-left shadow-brand-blue/10 dark:shadow-black/50"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/20 flex items-center justify-center text-brand-blue flex-shrink-0">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-base text-foreground dark:text-white flex items-center gap-1.5">
                  Cookie Consent
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  We use cookies to optimize site performance, analyze traffic, and personalize your experience. 
                  By clicking &quot;Accept All&quot;, you consent to our use of cookies. Read our{" "}
                  <a 
                    href="https://storefries.com/privacy.html" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="underline text-brand-blue hover:text-brand-blue/80 font-medium"
                  >
                    Privacy Policy
                  </a>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
              <button
                onClick={() => setShowPreferences(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-secondary dark:hover:bg-white/5 border border-border dark:border-white/10 text-foreground dark:text-white transition-all active:scale-95 duration-200"
              >
                Customize
              </button>
              <button
                onClick={handleAcceptEssential}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-secondary dark:hover:bg-white/5 border border-border dark:border-white/10 text-foreground dark:text-white transition-all active:scale-95 duration-200"
              >
                Essential Only
              </button>
              <button
                onClick={handleAcceptAll}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold btn-gradient border-0 text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center"
              >
                Accept All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPreferences && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="max-w-md w-full p-6 rounded-3xl bg-background dark:bg-card border border-border dark:border-white/10 shadow-2xl flex flex-col gap-6 text-left"
            >
              <div className="flex items-center justify-between border-b border-border dark:border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <Shield className="h-5 w-5 text-brand-blue" />
                  <h3 className="font-bold text-lg text-foreground dark:text-white">Cookie Preferences</h3>
                </div>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="p-1 rounded-lg hover:bg-secondary dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-5 my-2">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-foreground dark:text-white flex items-center gap-1.5">
                      Strictly Necessary
                      <span className="text-[10px] font-semibold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Required
                      </span>
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Essential for authentication, site security, and saving your preferences. Cannot be disabled.
                    </p>
                  </div>
                  <div className="flex items-center h-8">
                    <div className="w-11 h-6 bg-brand-blue/20 rounded-full flex items-center px-1 justify-end cursor-not-allowed opacity-80">
                      <div className="bg-brand-blue h-4 w-4 rounded-full flex items-center justify-center text-white">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border dark:bg-white/5" />

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-foreground dark:text-white flex items-center gap-1.5">
                      Performance & Analytics
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Help us measure traffic and see how visitors interact with features so we can optimize usability.
                    </p>
                  </div>
                  <div className="flex items-center h-8">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                    </label>
                  </div>
                </div>

                <div className="h-px bg-border dark:bg-white/5" />

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-foreground dark:text-white flex items-center gap-1.5">
                      Marketing & Targeting
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Allow us to display personalized ads on other networks and analyze audience behavior.
                    </p>
                  </div>
                  <div className="flex items-center h-8">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({ ...preferences, marketing: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border dark:border-white/5 pt-4">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-secondary dark:hover:bg-white/5 border border-border dark:border-white/10 text-foreground dark:text-white transition-all active:scale-95 duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="py-2.5 px-6 rounded-xl text-xs font-extrabold btn-gradient border-0 text-white shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
