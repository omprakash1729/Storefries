import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { Search, Globe, Zap, BarChart3, Users, MessageSquare, Share2, Target, ShieldCheck, TrendingUp, Quote, CheckCircle2 } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { SoftAurora } from "@/components/SoftAurora";
import { SplashCursor } from "@/components/SplashCursor";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden text-foreground transition-colors duration-300">
      {/* Interactive WebGL Splash Cursor trailing effect */}
      <div style={{ width: '1080px', height: '1080px', position: 'relative', display: 'none' }}>
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
      </div>
      
      {/* Standalone global SplashCursor overlay to ensure it tracks across the full viewport seamlessly */}
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
        title="Storefries Listing — Generate business landing pages from Google Maps"
        description="Paste a Google Maps link and instantly generate a clean, SEO-friendly landing page for any local business."
      />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        {/* Hero */}
        <motion.section
          initial="hidden" animate="visible" variants={staggerContainer}
          className="container pt-20 pb-8 md:pt-28 md:pb-12 text-center relative z-10"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center rounded-full border border-border/50 dark:border-white/10 bg-secondary/80 dark:bg-white/5 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-foreground mb-8 shadow-sm dark:shadow-[0_0_15px_rgba(110,219,72,0.1)]">
            <span>Powered by Storefries for SMB and early stage business</span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-foreground dark:bg-gradient-to-r dark:from-white dark:via-white dark:to-white/60 dark:bg-clip-text dark:text-transparent">
            Automate your local <br className="hidden md:block" /> marketing presence
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-medium relative z-20">
            Paste a Google Maps link and generate a high-converting, SEO-friendly landing page instantly. No code required.
          </motion.p>

          <motion.div variants={fadeInUp} className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-center gap-3 relative z-20 mb-6">
            <Button onClick={() => navigate("/generate")} className="h-14 px-12 rounded-xl font-bold text-lg btn-gradient border-0 text-white shadow-xl hover:scale-105 transition-transform duration-300">
              Get Started
            </Button>
          </motion.div>


        </motion.section>

        {/* How it works */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="container pb-24 relative z-10 mt-4 md:mt-8"
        >
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Search, title: "Paste a URL", desc: "Drop in a Google Maps or Business Profile link. We handle the rest automatically." },
              { icon: Zap, title: "Auto-fetch Intelligence", desc: "Our AI pulls photos, hours, reviews, and details to craft perfect content." },
              { icon: Globe, title: "Publish instantly", desc: "Get a clean, high-performing, SEO-friendly landing page instantly." },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div
                variants={fadeInUp}
                key={title}
                className="bg-card dark:glass-card-dark dark:glow-border border border-border dark:border-transparent shadow-soft rounded-3xl p-8 transition-transform hover:-translate-y-1 duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-brand-blue/10 dark:bg-gradient-to-br dark:from-brand-blue/20 dark:to-brand-green/20 border border-brand-blue/20 dark:border-white/5 flex items-center justify-center mb-6 shadow-inner">
                  <Icon className="h-6 w-6 text-brand-blue dark:text-brand-green" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground dark:text-white">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* About Storefries */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
          className="container pb-24 relative z-10"
        >
          <div className="bg-secondary/40 dark:bg-transparent dark:glass-card-dark rounded-[2.5rem] p-8 md:p-16 text-center border border-border/50 dark:border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/5 to-transparent pointer-events-none" />
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight text-foreground dark:text-white">The All-in-One Local Marketing Platform</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
              Storefries is a unified local marketing and customer experience platform designed for Enterprises, Franchises, Agencies, and Small Businesses. We combine search, reviews, and social media management in one powerful system.
            </p>
            <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Search, label: "Local Search" },
                { icon: Share2, label: "Social Media" },
                { icon: MessageSquare, label: "Reviews" },
                { icon: Target, label: "Competitor Insights" }
              ].map(({ icon: Icon, label }) => (
                <motion.div variants={fadeInUp} key={label} className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-background border border-border/50 dark:bg-black/40 dark:border-white/5 shadow-soft hover:shadow-md dark:hover:bg-white/5 transition-colors duration-300 backdrop-blur-sm group">
                  <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 dark:bg-gradient-to-br dark:from-brand-blue/10 dark:to-brand-green/10 flex items-center justify-center text-brand-blue mb-2 group-hover:scale-110 transition-transform duration-300 dark:border dark:border-white/5">
                    <Icon className="h-7 w-7 text-brand-blue dark:group-hover:text-brand-green transition-colors" />
                  </div>
                  <span className="font-bold text-sm text-foreground dark:text-white">{label}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Benefits & Metrics */}
        <section className="container pb-24 relative z-10 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight text-foreground dark:text-white">Drive real growth with <span className="text-brand-blue dark:bg-gradient-to-r dark:from-brand-blue dark:to-brand-green dark:bg-clip-text dark:text-transparent">measurable results</span></h2>
              <ul className="space-y-6 mb-8">
                {[
                  "Improve local rankings & visibility",
                  "Drive more foot traffic to your stores",
                  "Reduce manual marketing tasks",
                  "Improve customer experience centrally"
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-brand-blue/10 dark:bg-brand-blue/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-brand-blue" />
                    </div>
                    <span className="text-lg text-muted-foreground font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { value: "+1000", label: "Customer Reach", icon: Users },
                { value: "+25", label: "Competitive Advantage", icon: TrendingUp },
                { value: "57%", label: "Online Growth", icon: BarChart3 },
                { value: "100%", label: "Brand Consistency", icon: ShieldCheck }
              ].map((stat) => (
                <motion.div variants={fadeInUp} key={stat.label} className="bg-card dark:glass-card-dark dark:glow-border border border-border dark:border-transparent rounded-3xl p-8 text-center transition-all shadow-soft hover:shadow-md duration-300 hover:-translate-y-1.5">
                  <div className="h-12 w-12 mx-auto bg-brand-blue/5 dark:bg-white/5 rounded-xl flex items-center justify-center mb-6">
                    <stat.icon className="h-6 w-6 text-brand-blue dark:text-brand-green opacity-90" />
                  </div>
                  <div className="text-4xl font-black mb-2 text-foreground dark:text-white">{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-bold tracking-wider uppercase">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
          className="container pb-32 relative z-10"
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-foreground dark:text-white">Loved by multi-location brands</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">See how Storefries simplifies franchise marketing and content scheduling for businesses of all sizes.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Vivek", role: "CEO at ICIEL", quote: "The AI content generation and social consistency tools have completely transformed our workflow." },
              { name: "Sathiya Kumar", role: "CEO of Oxy Clean Services", quote: "A game-changer for multi-location management. The media library makes scheduling a breeze." },
              { name: "Celia Almeda", role: "Marketing Director", quote: "Storefries centralized our entire local marketing stack. It's simply the best platform out there." },
              { name: "Nat Reynolds", role: "Franchise Owner", quote: "Managing multiple profiles used to be a nightmare. Now, it's automated and seamless." },
              { name: "Mahima B", role: "Operations Manager", quote: "The competitor tracking and reputation management have given us a massive edge." },
              { name: "Bob Roberts", role: "Local Business Owner", quote: "Our foot traffic surged after we started using Storefries to manage our local presence." }
            ].map((testimonial) => (
              <motion.div variants={fadeInUp} key={testimonial.name} className="bg-card border border-border/50 shadow-soft dark:border-transparent dark:glass-card-dark p-8 rounded-3xl dark:shadow-xl hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-40 transition-opacity duration-300">
                  <Quote className="h-16 w-16 text-brand-blue dark:text-brand-green transform scale-x-[-1]" />
                </div>
                <p className="text-foreground/90 font-medium mb-8 leading-relaxed relative z-10 text-[15px]">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4 mt-auto relative z-10">
                  <div className="h-12 w-12 rounded-full bg-brand-blue/10 dark:bg-white/5 flex items-center justify-center font-bold text-xl text-brand-blue dark:text-white border border-brand-blue/20 dark:border-white/10 dark:shadow-inner">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-base text-foreground dark:text-white">{testimonial.name}</div>
                    <div className="text-xs text-brand-blue font-bold tracking-wide uppercase">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
