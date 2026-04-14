import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, X, Mail, Globe, MapPin, Briefcase, MessageSquare, 
  Instagram, Facebook, Phone, Plus, LogIn, UserPlus, Layout, Edit3, LogOut, Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageFormModal } from "@/components/MessageFormModal";
import { PublicProfile } from "@/hooks/usePublicTimeline";
import { supabase } from "@/integrations/supabase/client";

interface UserProfilePanelProps {
  profile: PublicProfile | null;
  isDemo?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const UserProfilePanel = ({ profile, isDemo, onOpenChange }: UserProfilePanelProps) => {
  const [isOpen, setIsOpenState] = useState(false);
  const setIsOpen = (open: boolean) => { setIsOpenState(open); onOpenChange?.(open); };
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!profile) return null;

  const isBusiness = profile.profile_type === 'business';
  const displayName = profile.display_name || profile.username;
  const occupation = profile.occupation;
  const location = profile.location;
  const email = profile.contact_email;
  const phone = profile.contact_phone;
  const website = profile.website;
  const bio = profile.bio;

  const getInitials = () => {
    const name = displayName || "U";
    return name
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Floating Icon Button - Bottom Right */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 overflow-hidden"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.98 }}
        data-testid="button-profile-icon"
      >
        {profile.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt={displayName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Backdrop Overlay — sits above all page UI (z-[60]) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            data-testid="backdrop-profile"
          />
        )}
      </AnimatePresence>

      {/* Glassmorphism Profile Panel — above backdrop (z-[70]) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 top-0 bottom-0 z-[70] w-full max-w-sm sm:max-w-md"
          >
            {/* Frosted Glass Card */}
            <div className="h-full bg-white/10 backdrop-blur-2xl border-r border-white/20 shadow-2xl overflow-hidden relative">
              {/* Close Button — always on top inside the panel */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border border-white/25 z-10"
                data-testid="button-close-profile"
                aria-label="Close profile panel"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Scrollable Content */}
              <div className="h-full overflow-y-auto px-6 py-8">
                <div className="flex flex-col items-start">
                  {/* Profile Avatar */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.08, duration: 0.3 }}
                    className="mb-6"
                  >
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-24 h-24 rounded-2xl object-cover shadow-lg border-2 border-white/30"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg border-2 border-white/30">
                        <span className="text-3xl font-bold text-white">{getInitials()}</span>
                      </div>
                    )}
                  </motion.div>

                  {/* Profile Type Badge */}
                  {isBusiness && (
                    <motion.div
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.12, duration: 0.3 }}
                      className="mb-2"
                    >
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30">
                        Business
                      </span>
                    </motion.div>
                  )}

                  {/* Display Name */}
                  <motion.h2
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.16, duration: 0.3 }}
                    className="text-3xl font-bold text-white mb-1"
                  >
                    {displayName}
                  </motion.h2>

                  {/* Username */}
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-white/60 text-sm mb-4"
                  >
                    @{profile.username}
                  </motion.p>

                  {/* Accent Line */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.24, duration: 0.4 }}
                    className="w-16 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full mb-6 origin-left"
                  />

                  {/* Bio */}
                  {bio && (
                    <motion.p
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.28, duration: 0.3 }}
                      className="text-white/80 text-sm leading-relaxed mb-8"
                    >
                      {bio}
                    </motion.p>
                  )}

                  {/* Info Cards */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.32, duration: 0.3 }}
                    className="w-full space-y-3 mb-6"
                  >
                    {occupation && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-200 hover:bg-white/10">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/50 mb-0.5">{isBusiness ? 'Industry' : 'Occupation'}</p>
                          <p className="text-sm font-medium text-white truncate">{occupation}</p>
                        </div>
                      </div>
                    )}

                    {location && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-200 hover:bg-white/10">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/50 mb-0.5">Location</p>
                          <p className="text-sm font-medium text-white truncate">{location}</p>
                        </div>
                      </div>
                    )}

                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-200 hover:bg-white/10 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                          <Mail className="w-5 h-5 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/50 mb-0.5">Email</p>
                          <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                            {email}
                          </p>
                        </div>
                      </a>
                    )}

                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-200 hover:bg-white/10 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                          <Phone className="w-5 h-5 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/50 mb-0.5">Phone</p>
                          <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                            {phone}
                          </p>
                        </div>
                      </a>
                    )}

                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-200 hover:bg-white/10 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                          <Globe className="w-5 h-5 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/50 mb-0.5">Website</p>
                          <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                            {website.replace(/^https?:\/\//, "")}
                          </p>
                        </div>
                      </a>
                    )}
                  </motion.div>

                  {/* Social Icons */}
                  {(profile.twitter || profile.instagram || profile.linkedin || profile.facebook) && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className="flex gap-3 mb-6"
                    >
                      {profile.twitter && (
                        <a
                          href={profile.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 flex items-center justify-center hover:scale-110"
                          aria-label="Twitter"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                      {profile.instagram && (
                        <a
                          href={profile.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 flex items-center justify-center hover:scale-110"
                          aria-label="Instagram"
                        >
                          <Instagram className="w-5 h-5 text-white" />
                        </a>
                      )}
                      {profile.linkedin && (
                        <a
                          href={profile.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 flex items-center justify-center hover:scale-110"
                          aria-label="LinkedIn"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      )}
                      {profile.facebook && (
                        <a
                          href={profile.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 flex items-center justify-center hover:scale-110"
                          aria-label="Facebook"
                        >
                          <Facebook className="w-5 h-5 text-white" />
                        </a>
                      )}
                    </motion.div>
                  )}

                  {/* Send Message Button */}
                  {!isDemo && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.44, duration: 0.3 }}
                      className="w-full"
                    >
                      <Button
                        onClick={() => setIsMessageModalOpen(true)}
                        className="w-full h-12 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-[1.02]"
                        size="lg"
                        data-testid="button-send-message"
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Send Message
                      </Button>
                    </motion.div>
                  )}

                  {/* Demo Notice */}
                  {isDemo && !isLoggedIn && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.44, duration: 0.3 }}
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <p className="text-white/60 text-sm text-center">
                        This is a demo timeline. Sign in to create your own!
                      </p>
                    </motion.div>
                  )}

                  {/* Auth / Navigation Section */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.48, duration: 0.3 }}
                    className="w-full mt-4"
                  >
                    <Separator className="bg-white/10 mb-4" />
                    <div className="space-y-1">
                      {isLoggedIn ? (
                        <>
                          <button
                            onClick={() => { setIsOpen(false); navigate('/editor'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                            data-testid="link-my-timelines"
                          >
                            <Layout className="w-4 h-4" />
                            My timelines
                          </button>
                          <button
                            onClick={() => { setIsOpen(false); navigate('/editor'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                            data-testid="link-open-editor"
                          >
                            <Edit3 className="w-4 h-4" />
                            Open editor
                          </button>
                          <button
                            onClick={() => { setIsOpen(false); navigate('/bookmarks'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                            data-testid="link-bookmarks"
                          >
                            <Bookmark className="w-4 h-4" />
                            Bookmarks
                          </button>
                          <button
                            onClick={async () => {
                              await supabase.auth.signOut();
                              setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                            data-testid="button-logout"
                          >
                            <LogOut className="w-4 h-4" />
                            Log out
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setIsOpen(false); navigate('/auth'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                            data-testid="link-create-timeline"
                          >
                            <Plus className="w-4 h-4" />
                            Create your own timeline
                          </button>
                          <button
                            onClick={() => { setIsOpen(false); navigate('/bookmarks'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                            data-testid="link-bookmarks"
                          >
                            <Bookmark className="w-4 h-4" />
                            Bookmarks
                          </button>
                          <button
                            onClick={() => { setIsOpen(false); navigate('/auth'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                            data-testid="link-sign-in"
                          >
                            <LogIn className="w-4 h-4" />
                            Sign in
                          </button>
                          <button
                            onClick={() => { setIsOpen(false); navigate('/auth'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                            data-testid="link-create-account"
                          >
                            <UserPlus className="w-4 h-4" />
                            Create account
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MessageFormModal
        open={isMessageModalOpen}
        onOpenChange={setIsMessageModalOpen}
        recipientUserId={profile.user_id}
      />
    </>
  );
};
