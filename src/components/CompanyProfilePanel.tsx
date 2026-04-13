import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X, Mail, Globe, MapPin, Briefcase, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageFormModal } from "@/components/MessageFormModal";

export const CompanyProfilePanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  useEffect(() => {
    fetchCompanyProfile();

    // Set up real-time subscription for instant sync
    const channel = supabase
      .channel('company_profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_profile'
        },
        (payload) => {
          console.log('Company profile updated:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setCompanyProfile(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("company_profile")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (data) setCompanyProfile(data);
    } catch (error) {
      console.error("Error fetching company profile:", error);
    }
  };

  const getInitials = () => {
    const name = companyProfile?.company_name || "VisionSwipe";
    return name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Floating Icon Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary/90 backdrop-blur-md flex items-center justify-center shadow-elevated hover:shadow-card transition-all duration-300 border border-border/50"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <Info className="w-6 h-6 text-primary-foreground" />
      </motion.button>

      {/* Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-40"
          />
        )}
      </AnimatePresence>

      {/* Frosted Glass Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] sm:max-h-[75vh] md:max-h-[65vh]"
          >
            {/* Frosted Glass Card */}
            <div className="bg-card/80 backdrop-blur-2xl border-t border-border/50 rounded-t-[2rem] shadow-elevated overflow-hidden">
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-muted/50 hover:bg-muted backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-105 border border-border/30"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>

              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-2rem)] sm:max-h-[calc(75vh-2rem)] md:max-h-[calc(65vh-2rem)] px-6 pb-8">
                <div className="flex flex-col items-center pt-2">
                  {/* Company Logo */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    {companyProfile?.logo_url ? (
                      <img
                        src={companyProfile.logo_url}
                        alt={`${companyProfile.company_name} logo`}
                        className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover shadow-card border-4 border-background mb-4 ring-2 ring-border/20"
                      />
                    ) : (
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center mb-4 shadow-card border-4 border-background ring-2 ring-border/20">
                        <span className="text-4xl font-bold text-primary-foreground">{getInitials()}</span>
                      </div>
                    )}
                  </motion.div>

                  {/* Company Name */}
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center"
                  >
                    {companyProfile?.company_name || "VisionSwipe"}
                  </motion.h2>

                  {/* Accent Line */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="w-20 h-1 bg-gradient-to-r from-accent via-primary to-accent rounded-full mb-3"
                  />

                  {/* Motto */}
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    className="text-sm md:text-base italic text-muted-foreground mb-8 text-center max-w-md px-4"
                  >
                    "{companyProfile?.motto || "Swipe Through Time, Organize Your Life"}"
                  </motion.p>

                  {/* Info Cards Grid */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="w-full max-w-lg space-y-3 mb-6"
                  >
                    {/* Industry */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/30 transition-all duration-200 hover:bg-muted/50 hover:scale-[1.02]">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Industry</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {companyProfile?.industry || "Productivity & Organization"}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/30 transition-all duration-200 hover:bg-muted/50 hover:scale-[1.02]">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {companyProfile?.location || "San Francisco, USA"}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <a
                      href={`mailto:${companyProfile?.contact_email || "hello@visionswipe.com"}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/30 transition-all duration-200 hover:bg-muted/50 hover:scale-[1.02] group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {companyProfile?.contact_email || "hello@visionswipe.com"}
                        </p>
                      </div>
                    </a>

                    {/* Website */}
                    {companyProfile?.website && (
                      <a
                        href={companyProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/30 transition-all duration-200 hover:bg-muted/50 hover:scale-[1.02] group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-0.5">Website</p>
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {companyProfile.website.replace(/^https?:\/\//, "")}
                          </p>
                        </div>
                      </a>
                    )}
                  </motion.div>

                  {/* Social Icons */}
                  {(companyProfile?.twitter_url || companyProfile?.linkedin_url) && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className="flex gap-3 mb-6"
                    >
                      {companyProfile?.twitter_url && (
                        <a
                          href={companyProfile.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-muted/50 hover:bg-primary backdrop-blur-sm border border-border/30 hover:border-primary/50 transition-all duration-200 flex items-center justify-center group hover:scale-110 shadow-subtle"
                          aria-label="Twitter"
                        >
                          <svg className="w-5 h-5 text-foreground group-hover:text-primary-foreground transition-colors" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                      {companyProfile?.linkedin_url && (
                        <a
                          href={companyProfile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-muted/50 hover:bg-primary backdrop-blur-sm border border-border/30 hover:border-primary/50 transition-all duration-200 flex items-center justify-center group hover:scale-110 shadow-subtle"
                          aria-label="LinkedIn"
                        >
                          <svg className="w-5 h-5 text-foreground group-hover:text-primary-foreground transition-colors" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      )}
                    </motion.div>
                  )}

                  {/* Send Message Button */}
                  {companyProfile?.enable_message_form && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.55, duration: 0.3 }}
                      className="w-full max-w-lg"
                    >
                      <Button
                        onClick={() => setIsMessageModalOpen(true)}
                        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-card hover:shadow-elevated transition-all duration-200 hover:scale-[1.02]"
                        size="lg"
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Send Message
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MessageFormModal
        open={isMessageModalOpen}
        onOpenChange={setIsMessageModalOpen}
      />
    </>
  );
};
