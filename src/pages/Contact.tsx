import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, MessageSquare, Globe } from "lucide-react";
import { toast } from "sonner";
import { SoftAurora } from "@/components/SoftAurora";
import { SplashCursor } from "@/components/SplashCursor";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message
          }
        ]);

      if (error) throw error;

      toast.success("Thank you for reaching out! Our team will get back to you shortly.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden text-foreground transition-colors duration-300">
      {/* Interactive WebGL Splash Cursor trailing effect */}
      <SplashCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1440}
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2}
        PRESSURE={0.1}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        COLOR_UPDATE_SPEED={10}
      />

      {/* Aurora Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <SoftAurora
          speed={0.6}
          scale={1.5}
          brightness={1}
          color1="#0077ff"
          color2="#00ff54"
          noiseFrequency={3}
          noiseAmplitude={1}
          bandHeight={0.5}
          bandSpread={1.3}
          octaveDecay={0.22}
          layerOffset={0.3}
          colorSpeed={1}
          enableMouseInteraction
          mouseInfluence={0.25}
        />
      </div>

      <Seo
        title="Contact Us — Storefries Listing Support"
        description="Get in touch with the Storefries team for support, feature requests, or business inquiries."
      />

      <SiteHeader />

      <main className="flex-1 container py-16 md:py-24 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-foreground dark:bg-gradient-to-r dark:from-white dark:to-white/60 dark:bg-clip-text dark:text-transparent">
                Get in Touch
              </h1>
              <p className="text-muted-foreground font-medium text-base leading-relaxed">
                Have questions about generating local listings, custom domains, or integrations? Drop us a message, and our support team will help you out.
              </p>
            </motion.div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Info Cards Column (L: 5 cols) */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-5 flex flex-col gap-6"
            >
              {/* Main Contact Card */}
              <div className="bg-card dark:glass-card-dark dark:glow-border border border-border dark:border-transparent rounded-3xl p-8 shadow-soft">
                <h3 className="text-xl font-bold mb-6 text-foreground dark:text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-brand-blue" />
                  Contact Information
                </h3>
                
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue flex-shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Us</h4>
                      <p className="text-sm font-semibold text-foreground dark:text-white mt-0.5">support@storefries.com</p>
                    </div>
                  </div>                </div>
              </div>

              {/* Redirection Callout Card */}
              <div className="bg-gradient-to-br from-[#031c36] to-[#010f1e] text-white rounded-3xl p-8 border border-white/5 relative overflow-hidden shadow-xl group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#6edb48] to-[#0073c8] opacity-10 blur-xl rounded-full pointer-events-none" />
                <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#6edb48]" />
                  Want to know about our products?
                </h4>
                <p className="text-xs text-white/70 leading-relaxed mb-6">
                  Looking for our full-suite social media engagement, reviews manager, or local SEO dashboards?
                </p>
                <a 
                  href="https://storefries.com/contactus.html" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-extrabold bg-white text-black hover:bg-white/95 transition-all duration-300 shadow-md hover:scale-[1.03]"
                >
                  Contact here
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </a>
              </div>
            </motion.div>

            {/* Form Column (R: 7 cols) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-7"
            >
              <form 
                onSubmit={handleSubmit}
                className="bg-card dark:glass-card-dark dark:glow-border border border-border dark:border-transparent rounded-3xl p-8 shadow-soft flex flex-col gap-5"
              >
                <h3 className="text-xl font-bold text-foreground dark:text-white mb-2">Send a Message</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Name *</label>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="rounded-xl border-border bg-background/50 dark:bg-black/30 h-11 px-4 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Email *</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="rounded-xl border-border bg-background/50 dark:bg-black/30 h-11 px-4 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Subject</label>
                  <Input
                    type="text"
                    placeholder="What is this regarding?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="rounded-xl border-border bg-background/50 dark:bg-black/30 h-11 px-4 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-1">Message *</label>
                  <Textarea
                    placeholder="Write your message here..."
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    className="rounded-xl border-border bg-background/50 dark:bg-black/30 p-4 text-sm resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-12 rounded-xl text-sm font-extrabold btn-gradient border-0 text-white shadow-md hover:scale-[1.01] active:scale-95 transition-all duration-300 mt-2 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Message
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Contact;
