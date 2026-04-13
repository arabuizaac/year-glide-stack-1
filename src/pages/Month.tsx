import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Pause, X, Bookmark } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGlobalBackground } from "@/contexts/GlobalBackgroundContext";
import { useImmersiveMode } from "@/hooks/useImmersiveMode";
import { getCachedYearData, preloadYearData } from "@/lib/yearDataCache";
import {
  saveStory,
  saveMoment,
  isStorySaved,
  isMomentSaved,
} from "@/lib/bookmarks";

interface MonthData {
  id: string;
  name: string;
  background_type: string;
  background_value: string | null;
  display_order: number;
}

interface CreatorInfo {
  userId: string;
  displayName: string;
  username: string;
}

const CARD_GAP = 14;
const AUTO_INTERVAL = 3000;
const VIRTUALIZE_WINDOW = 4;
const DOUBLE_TAP_DELAY = 300;
const DRAG_THRESHOLD = 8;

const Month = () => {
  const { year } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const cached = year ? getCachedYearData(year) : null;

  const [months, setMonths] = useState<MonthData[]>(cached?.months || []);
  const [yearName, setYearName] = useState(cached?.yearName || "");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(!cached);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);

  // Bookmark action sheet
  const [showBookmarkSheet, setShowBookmarkSheet] = useState(false);
  const [bookmarkTargetIndex, setBookmarkTargetIndex] = useState<number>(0);
  const [, forceUpdate] = useState(0);

  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { setBackground } = useGlobalBackground();
  const { isImmersiveMode, setIsImmersiveMode, handleDoubleTap: handleBgDoubleTap } = useImmersiveMode();

  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const wasDragging = useRef(false);
  const lastTapTime = useRef(0);
  const lastTapIndex = useRef(-1);

  const [cardWidth, setCardWidth] = useState(260);
  const [cardHeight, setCardHeight] = useState(360);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw < 480) {
        const w = Math.min(vw * 0.65, 280);
        setCardWidth(w);
        setCardHeight(Math.min(w * 1.4, vh * 0.55));
      } else if (vw < 768) {
        setCardWidth(240);
        setCardHeight(Math.min(340, vh * 0.55));
      } else if (vw < 1024) {
        setCardWidth(280);
        setCardHeight(Math.min(390, vh * 0.6));
      } else {
        setCardWidth(300);
        setCardHeight(Math.min(420, vh * 0.6));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const CARD_STEP = cardWidth + CARD_GAP;
  const rawX = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 280, damping: 34, mass: 0.9 });

  useEffect(() => {
    rawX.set(-activeIndex * CARD_STEP);
  }, [activeIndex, CARD_STEP, rawX]);

  // Jump to card from URL param (?card=monthId)
  useEffect(() => {
    const cardId = searchParams.get("card");
    if (cardId && months.length > 0) {
      const idx = months.findIndex(m => m.id === cardId);
      if (idx >= 0) setActiveIndex(idx);
    }
  }, [months, searchParams]);

  // Data fetch
  useEffect(() => {
    if (!year) return;

    const initialCache = getCachedYearData(year);
    if (initialCache) {
      if (initialCache.background?.value) {
        setBackground({ type: initialCache.background.type as any, value: initialCache.background.value });
      } else {
        setBackground({ type: "none", value: null });
      }
      setIsLoading(false);
    }

    const load = async () => {
      const data = await preloadYearData(year);
      if (data) {
        setYearName(data.yearName);
        setMonths(data.months);
        if (data.background?.value) {
          setBackground({ type: data.background.type as any, value: data.background.value });
        } else {
          setBackground({ type: "none", value: null });
        }
      } else {
        const [yearRes, monthsRes] = await Promise.all([
          supabase.from("years").select("name, background_type, background_value, user_id").eq("id", year).single(),
          supabase.from("months").select("*").eq("year_id", year).order("display_order", { ascending: true }),
        ]);
        if (yearRes.data?.name) setYearName(yearRes.data.name);
        if (monthsRes.error) {
          toast({ title: "Error", description: "Failed to fetch cards.", variant: "destructive" });
        } else {
          setMonths(monthsRes.data || []);
        }
        const yd = yearRes.data;
        if (yd?.background_type && yd?.background_value) {
          setBackground({ type: yd.background_type as any, value: yd.background_value });
        } else if (yd?.user_id) {
          const bgRes = await supabase
            .from("app_backgrounds")
            .select("background_type, background_value")
            .eq("user_id", yd.user_id)
            .eq("is_active", true)
            .single();
          if (bgRes.data?.background_type && bgRes.data?.background_value) {
            setBackground({ type: bgRes.data.background_type as any, value: bgRes.data.background_value });
          } else {
            setBackground({ type: "none", value: null });
          }
        } else {
          setBackground({ type: "none", value: null });
        }
      }
      setIsLoading(false);

      // Fetch creator info for bookmarks (non-blocking)
      const userId = (await supabase.from("years").select("user_id").eq("id", year).single()).data?.user_id;
      if (userId) {
        const pRes = await supabase
          .from("profiles")
          .select("user_id, display_name, username")
          .eq("user_id", userId)
          .single();
        if (pRes.data) {
          setCreatorInfo({
            userId: pRes.data.user_id,
            displayName: pRes.data.display_name || pRes.data.username,
            username: pRes.data.username,
          });
        }
      }
    };

    load();
  }, [year, setBackground]);

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
      setActiveIndex((prev) => {
        if (prev >= months.length - 1) { stopAutoPlay(); return prev; }
        return prev + 1;
      });
    }, AUTO_INTERVAL);
  }, [months.length, stopAutoPlay]);

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) stopAutoPlay(); else startAutoPlay();
  }, [isAutoPlaying, startAutoPlay, stopAutoPlay]);

  useEffect(() => () => stopAutoPlay(), [stopAutoPlay]);

  // Story mode (fullscreen play)
  const enterStoryMode = useCallback(() => {
    setIsStoryMode(true);
    startAutoPlay();
  }, [startAutoPlay]);

  const closeStoryMode = useCallback(() => {
    setIsStoryMode(false);
    stopAutoPlay();
  }, [stopAutoPlay]);

  // Double-tap detection per card
  const checkDoubleTap = useCallback((index: number) => {
    const now = Date.now();
    if (now - lastTapTime.current < DOUBLE_TAP_DELAY && lastTapIndex.current === index) {
      lastTapTime.current = 0;
      lastTapIndex.current = -1;
      return true;
    }
    lastTapTime.current = now;
    lastTapIndex.current = index;
    return false;
  }, []);

  const handleCardTap = useCallback((index: number) => {
    if (wasDragging.current) return;
    if (index === activeIndex) {
      if (checkDoubleTap(index)) setFullscreenIndex(index);
    } else {
      setActiveIndex(index);
      if (isAutoPlaying) stopAutoPlay();
    }
  }, [activeIndex, checkDoubleTap, isAutoPlaying, stopAutoPlay]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    wasDragging.current = false;
  }, []);

  const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = CARD_STEP * 0.25;
    const vx = info.velocity.x;
    const dx = info.offset.x;
    if (Math.abs(dx) > DRAG_THRESHOLD) wasDragging.current = true;
    if (Math.abs(dx) > threshold || Math.abs(vx) > 300) {
      if (dx < 0 || vx < -300) setActiveIndex(p => Math.min(months.length - 1, p + 1));
      else setActiveIndex(p => Math.max(0, p - 1));
    }
    if (isAutoPlaying) stopAutoPlay();
    requestAnimationFrame(() => { setTimeout(() => { wasDragging.current = false; }, 50); });
  }, [CARD_STEP, months.length, isAutoPlaying, stopAutoPlay]);

  // Wheel/trackpad
  const wheelAccum = useRef(0);
  const wheelTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const container = document.getElementById("month-carousel-root");
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (fullscreenIndex !== null || isStoryMode) return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = horizontal ? e.deltaX : e.deltaY;
      wheelAccum.current += delta;
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => { wheelAccum.current = 0; }, 150);
      if (Math.abs(wheelAccum.current) > 40) {
        if (wheelAccum.current > 0) setActiveIndex(p => Math.min(months.length - 1, p + 1));
        else setActiveIndex(p => Math.max(0, p - 1));
        wheelAccum.current = 0;
        if (isAutoPlaying) stopAutoPlay();
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [months.length, isAutoPlaying, stopAutoPlay, fullscreenIndex, isStoryMode]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isStoryMode && e.key === "Escape") { closeStoryMode(); return; }
      if (fullscreenIndex !== null && e.key === "Escape") { setFullscreenIndex(null); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); setActiveIndex(p => Math.max(0, p - 1)); if (isAutoPlaying) stopAutoPlay(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); setActiveIndex(p => Math.min(months.length - 1, p + 1)); if (isAutoPlaying) stopAutoPlay(); }
      else if (e.key === "Escape") navigate("/");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [months.length, navigate, isAutoPlaying, stopAutoPlay, fullscreenIndex, isStoryMode, closeStoryMode]);

  const getImage = (m: MonthData) => {
    if ((m.background_type === "image" || m.background_type === "video") && m.background_value) return m.background_value;
    return "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop&crop=entropy&auto=format&q=90";
  };

  const handleBookmarkIconClick = useCallback((index: number) => {
    setBookmarkTargetIndex(index);
    setShowBookmarkSheet(true);
  }, []);

  const handleSaveMoment = useCallback(() => {
    const m = months[bookmarkTargetIndex];
    if (!m || !year) return;
    const saved = saveMoment({
      monthId: m.id,
      monthName: m.name,
      yearId: year,
      yearName,
      imageUrl: getImage(m),
    });
    setShowBookmarkSheet(false);
    forceUpdate(n => n + 1);
    toast({ title: saved ? "Moment saved" : "Already saved", description: saved ? `"${m.name}" added to your bookmarks` : "This moment is already in your bookmarks" });
  }, [months, bookmarkTargetIndex, year, yearName, toast]);

  const handleSaveStory = useCallback(() => {
    if (!creatorInfo || !year) return;
    const imageUrl = months[activeIndex] ? getImage(months[activeIndex]) : undefined;
    const saved = saveStory({
      userId: creatorInfo.userId,
      displayName: creatorInfo.displayName,
      username: creatorInfo.username,
      yearId: year,
      yearName,
      imageUrl,
    });
    setShowBookmarkSheet(false);
    toast({ title: saved ? "Story saved" : "Already saved", description: saved ? `"${yearName}" added to your bookmarks` : "This story is already in your bookmarks" });
  }, [creatorInfo, year, yearName, months, activeIndex, toast]);

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="relative h-[100dvh] overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <ArrowLeft className="w-4 h-4" /><span>Back</span>
            </div>
            <div className="h-5 w-24 rounded bg-white/10 animate-pulse" />
            <div className="w-16" />
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden select-none">
            <div className="flex items-center gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="shrink-0 rounded-2xl bg-white/8 animate-pulse"
                  style={{ width: i === 1 ? cardWidth : cardWidth * 0.92, height: i === 1 ? cardHeight : cardHeight * 0.92, opacity: i === 1 ? 1 : 0.5 }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            <div className="flex gap-1.5 mt-4">
              {[0, 1, 2].map(i => <div key={i} className={`rounded-full bg-white/20 animate-pulse ${i === 0 ? "w-5 h-2" : "w-2 h-2"}`} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (months.length === 0) {
    return (
      <div className="relative h-[100dvh] overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center p-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm min-h-[48px]">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-white font-semibold text-lg ml-4">{yearName}</h1>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/80 px-6">
              <h2 className="text-xl font-semibold mb-2">No Cards Yet</h2>
              <p className="text-white/60 text-sm">Add cards in the editor to see them here!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const chainWidth = months.length * CARD_STEP - CARD_GAP;
  const centerOffset = typeof window !== "undefined" ? window.innerWidth / 2 - cardWidth / 2 : 0;

  return (
    <div id="month-carousel-root" className="relative h-[100dvh] overflow-hidden touch-none">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black/30 z-[1]"
        onDoubleClick={(e) => { if (e.target === e.currentTarget) setIsImmersiveMode(prev => !prev); }}
        onTouchEnd={(e) => { if (e.target === e.currentTarget) handleBgDoubleTap(); }}
      />

      <motion.div
        className="relative z-10 flex flex-col h-full"
        animate={{ opacity: isImmersiveMode ? 0 : 1, pointerEvents: isImmersiveMode ? "none" : "auto" }}
        transition={{ duration: 0.7 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 z-20 shrink-0">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm min-h-[48px]">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-white font-semibold text-lg truncate mx-4">{yearName}</h1>
          <div className="w-16 shrink-0" />
        </div>

        {/* Chain carousel */}
        <div className="flex-1 flex items-center overflow-hidden select-none">
          <motion.div
            className="flex items-center will-change-transform"
            style={{ x: springX, paddingLeft: centerOffset, gap: `${CARD_GAP}px` }}
            drag="x"
            dragConstraints={{ left: -(chainWidth - cardWidth + centerOffset), right: centerOffset }}
            dragElastic={0.08}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            onPointerDown={handlePointerDown}
          >
            {months.map((month, index) => {
              const isVisible = Math.abs(index - activeIndex) <= VIRTUALIZE_WINDOW;
              if (!isVisible) return <div key={month.id} className="shrink-0" style={{ width: cardWidth, height: cardHeight }} />;

              const isActive = index === activeIndex;
              const momentSaved = isMomentSaved(month.id);

              return (
                <motion.div
                  key={month.id}
                  data-card
                  className="shrink-0 rounded-2xl overflow-hidden relative cursor-pointer"
                  style={{ width: cardWidth, height: cardHeight, willChange: "transform, opacity" }}
                  animate={{ scale: isActive ? 1 : 0.92, opacity: isActive ? 1 : 0.7 }}
                  transition={{ type: "tween", duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  onClick={() => handleCardTap(index)}
                >
                  {/* Shadow */}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: isActive ? "0 20px 60px -15px rgba(0,0,0,0.5), 0 8px 20px -8px rgba(0,0,0,0.3)" : "0 8px 30px -10px rgba(0,0,0,0.3)" }} />

                  {/* Media */}
                  {month.background_type === "video" && month.background_value ? (
                    <video src={month.background_value} className="absolute inset-0 w-full h-full object-cover rounded-2xl" loop muted playsInline preload={Math.abs(index - activeIndex) <= 1 ? "auto" : "metadata"} />
                  ) : (
                    <img src={getImage(month)} alt={month.name} className="absolute inset-0 w-full h-full object-cover rounded-2xl" loading={Math.abs(index - activeIndex) <= 1 ? "eager" : "lazy"} decoding={Math.abs(index - activeIndex) <= 1 ? "sync" : "async"} fetchPriority={index === activeIndex ? "high" : "auto"} />
                  )}

                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />

                  {/* Bookmark button — top-right, active card only */}
                  {isActive && (
                    <button
                      onClick={e => { e.stopPropagation(); handleBookmarkIconClick(index); }}
                      className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/50 transition-colors"
                      title="Bookmark"
                    >
                      <Bookmark className={`w-3.5 h-3.5 transition-all ${momentSaved ? "text-white fill-white" : "text-white/70"}`} />
                    </button>
                  )}

                  {/* Text overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-white/50 text-[10px] tracking-[0.15em] uppercase block mb-1">Story</span>
                    <h3 className="text-white text-base font-bold leading-tight" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>{month.name}</h3>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom controls — play → dots → counter */}
        <div className="flex flex-col items-center pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] z-20 shrink-0">
          {/* Play button — enters story mode */}
          <button
            onClick={enterStoryMode}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
          </button>

          {/* Dots */}
          {months.length <= 12 && (
            <div className="flex gap-1.5 items-center mt-4">
              {months.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveIndex(i); if (isAutoPlaying) stopAutoPlay(); }}
                  className={`rounded-full transition-all duration-300 ${i === activeIndex ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50"}`}
                />
              ))}
            </div>
          )}

          {/* Counter */}
          <span className="mt-2 text-white/50 text-xs tabular-nums">{activeIndex + 1} / {months.length}</span>
        </div>
      </motion.div>

      {/* Immersive mode hint */}
      <AnimatePresence>
        {isImmersiveMode && (
          <motion.div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-white/30 text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            Double-tap background to exit immersive mode
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fullscreen Story Mode ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isStoryMode && months[activeIndex] && (
          <motion.div
            className="fixed inset-0 z-[150] bg-black overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Cinematic card fill with per-card transitions */}
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={activeIndex}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {months[activeIndex].background_type === "video" && months[activeIndex].background_value ? (
                  <video
                    src={months[activeIndex].background_value!}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay loop muted playsInline
                  />
                ) : (
                  <img
                    src={getImage(months[activeIndex])}
                    alt={months[activeIndex].name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                <div className="absolute bottom-32 left-6 right-6">
                  <p className="text-white/50 text-xs tracking-[0.2em] uppercase mb-2">Story</p>
                  <h2 className="text-white text-2xl font-bold leading-tight" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                    {months[activeIndex].name}
                  </h2>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Close (X) — top-right */}
            <button
              onClick={closeStoryMode}
              className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              style={{ marginTop: "env(safe-area-inset-top)" }}
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Bottom controls — pause/play → dots → counter */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
              <button
                onClick={toggleAutoPlay}
                className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                {isAutoPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                )}
              </button>

              {months.length <= 12 && (
                <div className="flex gap-2 mt-4">
                  {months.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveIndex(i); if (!isAutoPlaying) startAutoPlay(); }}
                      className={`rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50"}`}
                    />
                  ))}
                </div>
              )}

              <span className="mt-2 text-white/50 text-xs tabular-nums">{activeIndex + 1} / {months.length}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Single-card fullscreen (double-tap) ─────────────────────────────── */}
      <AnimatePresence>
        {fullscreenIndex !== null && months[fullscreenIndex] && (
          <motion.div
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={() => setFullscreenIndex(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-h-[48px] min-w-[48px]"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            {months[fullscreenIndex].background_type === "video" && months[fullscreenIndex].background_value ? (
              <video src={months[fullscreenIndex].background_value!} className="w-full h-full object-contain" controls autoPlay playsInline />
            ) : (
              <img src={getImage(months[fullscreenIndex])} alt={months[fullscreenIndex].name} className="w-full h-full object-contain" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bookmark action sheet ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBookmarkSheet && (
          <>
            <motion.div
              className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookmarkSheet(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[210] bg-white/10 backdrop-blur-2xl border-t border-white/15 rounded-t-3xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-5" />

              <p className="text-white/50 text-xs tracking-widest uppercase mb-4 text-center">Save to Bookmarks</p>

              <div className="space-y-2 max-w-sm mx-auto">
                <button
                  onClick={handleSaveMoment}
                  className="w-full py-3.5 rounded-2xl bg-white/15 border border-white/20 text-white font-medium hover:bg-white/25 active:scale-98 transition-all"
                >
                  Save this moment
                </button>

                {creatorInfo && (
                  <button
                    onClick={handleSaveStory}
                    className="w-full py-3.5 rounded-2xl bg-white/10 border border-white/15 text-white/80 font-medium hover:bg-white/20 active:scale-98 transition-all"
                  >
                    Save entire story
                  </button>
                )}

                <button
                  onClick={() => setShowBookmarkSheet(false)}
                  className="w-full py-3.5 rounded-2xl text-white/50 font-medium hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Month;
