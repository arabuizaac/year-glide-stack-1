import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronUp, ChevronDown } from "lucide-react";
import { YearCard } from "./YearCard";
import { UserProfilePanel } from "./UserProfilePanel";
import { useCreatorDiscovery } from "@/hooks/useCreatorDiscovery";
import { useImmersiveMode } from "@/hooks/useImmersiveMode";
import { useGlobalBackground } from "@/contexts/GlobalBackgroundContext";
import { preloadYearData } from "@/lib/yearDataCache";

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
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#000' }}>
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
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ background: '#000' }}>
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
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#000' }}>
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

                const imageUrl =
                  year.background_type === "image" && year.background_value
                    ? year.background_value
                    : "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop&crop=entropy&auto=format&q=90";

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
                    imageUrl={imageUrl}
                    onSwipeOut={(d) => goTo(d)}
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

      {/* Profile Panel — always rendered so fixed children can be above page UI */}
      <div
        style={{ transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)' }}
        className={isImmersiveMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      >
        <UserProfilePanel
          profile={selectedProfile}
          isDemo={isDemo}
          onOpenChange={(open) => { profileOpenRef.current = open; }}
        />
      </div>
    </div>
  );
};
