import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronUp, ChevronDown, Bookmark, X, LogIn, UserPlus, Share2, Copy, Check } from "lucide-react";
import { YearCard } from "./YearCard";
import { UserProfilePanel } from "./UserProfilePanel";
import { useCreatorDiscovery } from "@/hooks/useCreatorDiscovery";
import { useImmersiveMode } from "@/hooks/useImmersiveMode";
import { useGlobalBackground } from "@/contexts/GlobalBackgroundContext";
import { preloadYearData } from "@/lib/yearDataCache";
import {
  saveStory,
  isStorySaved,
} from "@/lib/bookmarks";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const PublicYearStackContainer = () => {
  const {
    years,
    selectedProfile,
    activeBackground,
    isLoading,
    isDemo,
    goToCreator,
    totalCreators,
    currentCreatorIndex,
  } = useCreatorDiscovery();

  const { isImmersiveMode, setIsImmersiveMode, resetIdleTimer, handleDoubleTap } = useImmersiveMode();
  const { setBackground } = useGlobalBackground();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isTransitioningCreator, setIsTransitioningCreator] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Bookmark state
  const [showBookmarkSheet, setShowBookmarkSheet] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, forceBookmarkUpdate] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setIsLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const handleBookmarkClick = useCallback(() => {
    setShowBookmarkSheet(true);
  }, []);

  // Share state
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const getShareData = useCallback(() => {
    const profile = selectedProfile;
    const year = years[currentIndex];
    const url = profile
      ? `${window.location.origin}/u/${profile.username}`
      : window.location.href;
    const title = year
      ? `${year.name} — ${profile?.display_name || profile?.username || "Kiko"}`
      : profile?.display_name || profile?.username || "A story on Kiko";
    const text = `Check out this story on Kiko`;
    return { url, title, text };
  }, [selectedProfile, years, currentIndex]);

  const handleShare = useCallback(async () => {
    const { url, title, text } = getShareData();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User cancelled or share failed — fallback to panel
        setShowSharePanel(true);
      }
    } else {
      setShowSharePanel(true);
    }
  }, [getShareData]);

  const handleCopyLink = useCallback(async () => {
    const { url } = getShareData();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [getShareData]);

  const handleSaveStory = useCallback(() => {
    if (!selectedProfile || !years[currentIndex]) return;
    const year = years[currentIndex];
    const imageUrl = (year.background_type === "image" && year.background_value) ? year.background_value : undefined;
    const saved = saveStory({
      userId: selectedProfile.user_id,
      displayName: selectedProfile.display_name || selectedProfile.username,
      username: selectedProfile.username,
      yearId: year.id,
      yearName: year.name,
      imageUrl,
    });
    setShowBookmarkSheet(false);
    forceBookmarkUpdate(n => n + 1);
    toast({ title: saved ? "Story saved" : "Already saved", description: saved ? `"${year.name}" added to your bookmarks` : "This story is already saved" });
  }, [selectedProfile, years, currentIndex, toast]);

  // Drag state
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const gestureAxis = useRef<"horizontal" | "vertical" | null>(null);

  // Tracks whether the profile panel is open — used to suppress gestures while panel is visible
  const profileOpenRef = useRef(false);

  // Tracks which way the creator is switching so AnimatePresence can pick the right slide direction
  const transitionDirectionRef = useRef<"up" | "down">("up");

  // Reset card index when creator changes (no auto-advance — user controls navigation)
  useEffect(() => {
    if (years.length > 0) {
      setCurrentIndex(0);
    }
  }, [selectedProfile?.user_id, years.length]);

  // Background sync
  useEffect(() => {
    const activeYear = years[currentIndex];
    if (activeBackground?.background_type && activeBackground?.background_value) {
      setBackground({
        type: activeBackground.background_type as "image" | "video" | "color",
        value: activeBackground.background_value,
      });
    } else if (activeYear?.background_type && activeYear?.background_value) {
      setBackground({
        type: activeYear.background_type as "image" | "video" | "color",
        value: activeYear.background_value,
      });
    } else {
      setBackground({ type: "none", value: null });
    }
  }, [activeBackground, years, currentIndex, setBackground]);

  // Silently preload the center year + adjacent years so Month.tsx loads from cache
  useEffect(() => {
    if (years.length === 0) return;
    const toPreload = [
      years[currentIndex],
      years[currentIndex + 1],
      years[currentIndex - 1],
    ].filter(Boolean);
    toPreload.forEach((y) => {
      if (y?.id) preloadYearData(y.id);
    });
  }, [currentIndex, years]);

  // Auto-play
  const stopAutoPlay = useCallback(() => {
    setIsAutoPlaying(false);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = null;
  }, []);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    setIsAutoPlaying(true);
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= years.length - 1) {
          stopAutoPlay();
          return prev;
        }
        return prev + 1;
      });
    }, 3000);
  }, [years.length, stopAutoPlay]);

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) stopAutoPlay();
    else startAutoPlay();
  }, [isAutoPlaying, startAutoPlay, stopAutoPlay]);

  useEffect(() => () => { stopAutoPlay(); }, [stopAutoPlay]);

  // Horizontal card navigation
  const goTo = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating || years.length === 0) return;
      resetIdleTimer();
      if (isAutoPlaying) stopAutoPlay();
      setIsAnimating(true);
      if (direction === "left" && currentIndex < years.length - 1) {
        setCurrentIndex((p) => p + 1);
      } else if (direction === "right" && currentIndex > 0) {
        setCurrentIndex((p) => p - 1);
      }
      setTimeout(() => setIsAnimating(false), 400);
    },
    [currentIndex, isAnimating, years.length, resetIdleTimer, isAutoPlaying, stopAutoPlay]
  );

  // Vertical creator navigation
  const switchCreator = useCallback(
    async (direction: "up" | "down") => {
      if (isTransitioningCreator) return;
      if (isAutoPlaying) stopAutoPlay();
      transitionDirectionRef.current = direction;
      setIsTransitioningCreator(true);
      const success = await goToCreator(direction);
      setTimeout(() => setIsTransitioningCreator(false), 500);
      return success;
    },
    [isTransitioningCreator, goToCreator, isAutoPlaying, stopAutoPlay]
  );

  const handleCardDoubleClick = useCallback(
    (yearId: string) => {
      if (!isDemo) navigate(`/year/${yearId}`);
    },
    [isDemo, navigate]
  );

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (profileOpenRef.current) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo("right"); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goTo("left"); }
      else if (e.key === "ArrowUp") { e.preventDefault(); switchCreator("down"); }
      else if (e.key === "ArrowDown") { e.preventDefault(); switchCreator("up"); }
      else if (e.key === "Enter" && years[currentIndex] && !isDemo) {
        e.preventDefault();
        navigate(`/year/${years[currentIndex].id}`);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goTo, switchCreator, currentIndex, navigate, years, isDemo]);

  // Track touch target
  const touchTarget = useRef<EventTarget | null>(null);

  // Touch & wheel + desktop double-click for immersive mode
  useEffect(() => {
    let gestureTriggered = false;
    // Track last touch timestamp so desktop dblclick handler can
    // ignore the synthetic click that touch devices fire after a tap
    let lastTouchTimestamp = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (profileOpenRef.current) return;
      lastTouchTimestamp = Date.now();
      dragStartX.current = e.touches[0].clientX;
      dragStartY.current = e.touches[0].clientY;
      isDragging.current = true;
      gestureAxis.current = null;
      gestureTriggered = false;
      touchTarget.current = e.target;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (profileOpenRef.current) return;
      e.preventDefault();
      if (!isDragging.current || gestureTriggered || isAnimating) return;

      const dx = e.touches[0].clientX - dragStartX.current;
      const dy = e.touches[0].clientY - dragStartY.current;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);

      if (!gestureAxis.current && (ax > 10 || ay > 10)) {
        gestureAxis.current = ax > ay ? "horizontal" : "vertical";
      }

      if (gestureAxis.current === "horizontal" && ax > 50) {
        gestureTriggered = true;
        goTo(dx > 0 ? "right" : "left");
      } else if (gestureAxis.current === "vertical" && ay > 60) {
        gestureTriggered = true;
        switchCreator(dy > 0 ? "down" : "up");
      }
    };

    const onTouchEnd = () => {
      const tappedOnCard =
        touchTarget.current instanceof HTMLElement &&
        touchTarget.current.closest("[data-card]");
      if (!gestureTriggered && !gestureAxis.current && !tappedOnCard) {
        handleDoubleTap();
      }
      isDragging.current = false;
      gestureAxis.current = null;
      touchTarget.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      if (profileOpenRef.current) return;
      e.preventDefault();
      if (isAnimating) return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (horizontal) {
        if (Math.abs(e.deltaX) > 20) goTo(e.deltaX > 0 ? "left" : "right");
      } else {
        if (Math.abs(e.deltaY) > 30) switchCreator(e.deltaY > 0 ? "up" : "down");
      }
    };

    // Desktop double-click → toggle immersive mode.
    // Guard against touch devices that also fire dblclick after two rapid taps.
    const onDblClick = (e: MouseEvent) => {
      // Skip if a real touch event happened recently (touch fires synthetic click ~300ms later)
      if (Date.now() - lastTouchTimestamp < 800) return;
      // Skip if the user double-clicked an interactive element
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[data-card]") ||
        target.closest("[role='button']")
      ) return;
      setIsImmersiveMode((prev) => !prev);
    };

    const prevent = (e: Event) => e.preventDefault();

    document.addEventListener("touchstart", onTouchStart, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("scroll", prevent, { passive: false });
    document.addEventListener("dblclick", onDblClick);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("scroll", prevent);
      document.removeEventListener("dblclick", onDblClick);
    };
  }, [goTo, switchCreator, isAnimating, handleDoubleTap, setIsImmersiveMode]);

  const getPosition = (index: number): "left" | "center" | "right" | "hidden" => {
    if (index === currentIndex - 1) return "left";
    if (index === currentIndex) return "center";
    if (index === currentIndex + 1) return "right";
    return "hidden";
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-white/80 text-lg"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading timelines...
        </motion.div>
      </div>
    );
  }

  if (isDemo) {
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
        <div className="relative z-10 text-center text-white/80 px-6">
          <h2 className="text-2xl font-semibold mb-3">No Account Created</h2>
          <p className="text-white/50 text-sm max-w-sm mx-auto">
            No public timelines are available yet. Sign in to create your own Kiko timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background overlay — double-click handled globally in useEffect */}
      <div className="absolute inset-0 bg-black/40 z-[1]" />

      {/* TikTok-style vertical slide between creators */}
      <AnimatePresence
        mode="sync"
        custom={transitionDirectionRef.current}
      >
        <motion.div
          key={currentCreatorIndex}
          className="absolute inset-0 z-10"
          style={{ willChange: "transform", backfaceVisibility: "hidden" }}
          custom={transitionDirectionRef.current}
          variants={{
            enter: (dir: "up" | "down") => ({
              y: dir === "up" ? "101%" : "-101%",
            }),
            visible: {
              y: 0,
              transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
            },
            exit: (dir: "up" | "down") => ({
              y: dir === "up" ? "-101%" : "101%",
              transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
            }),
          }}
          initial="enter"
          animate="visible"
          exit="exit"
        >
      {/* Immersive-mode wrapper — fades whole UI out without disrupting slide key */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: isImmersiveMode ? 0 : 1,
          pointerEvents: isImmersiveMode ? "none" : "auto",
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Profile indicator */}
        {selectedProfile && (
          <motion.div
            key={selectedProfile.user_id}
            className="absolute top-4 left-4 z-40 flex items-center gap-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-full px-4 py-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
              {selectedProfile.avatar_url ? (
                <img src={selectedProfile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                selectedProfile.display_name?.[0]?.toUpperCase() || selectedProfile.username[0].toUpperCase()
              )}
            </div>
            <span className="text-white text-sm font-medium">
              {selectedProfile.display_name || selectedProfile.username}
            </span>
          </motion.div>
        )}

        {/* Vertical navigation hints */}
        {totalCreators > 1 && (
          <>
            {currentCreatorIndex > 0 && (
              <motion.div
                className="absolute top-16 left-1/2 -translate-x-1/2 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <ChevronUp className="w-5 h-5 text-white animate-bounce" />
              </motion.div>
            )}
            {currentCreatorIndex < totalCreators - 1 && (
              <motion.div
                className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <ChevronDown className="w-5 h-5 text-white animate-bounce" />
              </motion.div>
            )}
          </>
        )}

        {/* Horizontal carousel */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {years.map((year, index) => {
                const position = getPosition(index);
                if (position === "hidden") return null;

                const isVideo =
                  year.background_type === "video" && !!year.background_value;
                const mediaUrl = year.background_value
                  ? year.background_value
                  : "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop&crop=entropy&auto=format&q=90";

                const isBookmarked = !!(selectedProfile && isStorySaved(selectedProfile.user_id));
                return (
                  <YearCard
                    key={year.id}
                    year={year.name}
                    position={position}
                    onClick={() => {
                      if (position !== "center") {
                        setCurrentIndex(index);
                      }
                    }}
                    onDoubleClick={() => handleCardDoubleClick(year.id)}
                    imageUrl={mediaUrl}
                    mediaType={isVideo ? "video" : "image"}
                    onSwipeOut={(d) => goTo(d)}
                    onBookmarkClick={handleBookmarkClick}
                    isBookmarked={isBookmarked}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom nav: play → dots → counter (vertically stacked, centered) */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Play / Pause button */}
          {years.length > 1 && (
            <button
              onClick={toggleAutoPlay}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              {isAutoPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
              )}
            </button>
          )}

          {/* Progress dots — 16px below play */}
          {years.length > 1 && (
            <div className="flex gap-2 mt-4">
              {years.map((_, index) => (
                <motion.div
                  key={index}
                  className={`rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-6 h-2 bg-white"
                      : "w-2 h-2 bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Creator position counter — 8px below dots */}
          {totalCreators > 1 && (
            <span className="text-white/30 text-xs mt-2">
              {currentCreatorIndex + 1} / {totalCreators}
            </span>
          )}
        </motion.div>
      </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Immersive mode hint */}
      <AnimatePresence>
        {isImmersiveMode && (
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-white/30 text-xs select-none pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            Double-tap or click to exit immersive mode
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Panel + Share Button — fade out in immersive mode */}
      <div
        style={{ transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        className={isImmersiveMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      >
        <UserProfilePanel
          profile={selectedProfile}
          isDemo={isDemo}
          onOpenChange={(open) => { profileOpenRef.current = open; }}
        />

        {/* Share button — sits just above the profile button */}
        {selectedProfile && (
          <motion.button
            onClick={handleShare}
            className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 flex items-center justify-center shadow-md hover:bg-white/25 transition-colors"
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Share timeline"
          >
            <Share2 className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </motion.button>
        )}
      </div>

      {/* ── Share panel ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSharePanel && (() => {
          const { url, title } = getShareData();
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}`;
          const twitterUrl  = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
          return (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSharePanel(false)}
              />
              {/* Sheet */}
              <motion.div
                className="fixed bottom-0 left-0 right-0 z-[90] px-4"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 42 }}
              >
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl rounded-b-none overflow-hidden pb-10">
                  {/* Handle */}
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-white/30" />
                  </div>

                  {/* Close */}
                  <button
                    onClick={() => setShowSharePanel(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>

                  <div className="px-6 pt-2 pb-2">
                    <p className="text-white/40 text-xs tracking-widest uppercase text-center mb-1">Share</p>
                    {/* Title preview */}
                    <p className="text-white/60 text-sm text-center mb-5 truncate px-4">{title}</p>

                    <div className="space-y-3">
                      {/* Copy link */}
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] transition-all duration-200 text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                          <AnimatePresence mode="wait">
                            {linkCopied ? (
                              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <Check className="w-5 h-5 text-green-400" />
                              </motion.div>
                            ) : (
                              <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <Copy className="w-5 h-5 text-white" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{linkCopied ? "Link copied!" : "Copy link"}</p>
                          <p className="text-white/50 text-xs mt-0.5 truncate max-w-[220px]">{url}</p>
                        </div>
                      </button>

                      {/* WhatsApp */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowSharePanel(false)}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </div>
                        <p className="text-white font-semibold text-sm">Share on WhatsApp</p>
                      </a>

                      {/* X / Twitter */}
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowSharePanel(false)}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                          <svg className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="white">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </div>
                        <p className="text-white font-semibold text-sm">Share on X</p>
                      </a>

                      {/* Cancel */}
                      <button
                        onClick={() => setShowSharePanel(false)}
                        className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ── Bookmark action sheet ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBookmarkSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookmarkSheet(false)}
            />
            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[90] px-4 pb-safe"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
            >
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl rounded-b-none overflow-hidden mb-0 pb-8">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-white/30" />
                </div>

                {/* Close */}
                <button
                  onClick={() => setShowBookmarkSheet(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>

                <div className="px-6 pt-2 pb-4">
                  <p className="text-white/40 text-xs tracking-widest uppercase text-center mb-5">Save to Bookmarks</p>

                  {isLoggedIn ? (
                    <div className="space-y-3">
                      {/* Save story */}
                      <button
                        onClick={handleSaveStory}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] transition-all duration-200 text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                          <Bookmark className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">Save this story</p>
                          <p className="text-white/50 text-xs mt-0.5">Save the whole timeline to revisit later</p>
                        </div>
                      </button>

                      {/* Cancel */}
                      <button
                        onClick={() => setShowBookmarkSheet(false)}
                        className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    /* Logged-out: prompt sign in */
                    <div className="space-y-3">
                      <div className="text-center py-2 mb-1">
                        <Bookmark className="w-8 h-8 text-white/30 mx-auto mb-3" />
                        <p className="text-white/80 font-medium text-sm mb-1">Save stories to revisit anytime</p>
                        <p className="text-white/40 text-xs">Sign in to keep your bookmarks</p>
                      </div>
                      <button
                        onClick={() => { setShowBookmarkSheet(false); navigate('/auth'); }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/20 hover:bg-white/30 transition-colors text-white font-semibold text-sm"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign in
                      </button>
                      <button
                        onClick={() => { setShowBookmarkSheet(false); navigate('/auth'); }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/8 hover:bg-white/15 transition-colors text-white/70 text-sm"
                      >
                        <UserPlus className="w-4 h-4" />
                        Create account
                      </button>
                      <button
                        onClick={() => setShowBookmarkSheet(false)}
                        className="w-full py-3 text-white/30 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
