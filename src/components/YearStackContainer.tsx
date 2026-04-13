import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { YearCard } from "./YearCard";
import { AnimatePresence } from "framer-motion";

interface Year {
  id: string;
  name: string;
  background_type: string | null;
  background_value: string | null;
  display_order: number | null;
}

interface YearStackContainerProps {
  userId?: string;
  isPublicView?: boolean;
}

export const YearStackContainer = ({ userId, isPublicView = false }: YearStackContainerProps) => {
  const [years, setYears] = useState<Year[]>([]);
  const [activeBackground, setActiveBackground] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const gestureAxis = useRef<"horizontal" | "vertical" | null>(null);

  useEffect(() => {
    fetchYears();
    if (userId) fetchActiveBackground();
  }, [userId]);

  const fetchYears = async () => {
    let query = supabase.from("years").select("*").order("display_order", { ascending: true });
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (!error && data) {
      setYears(data);
      if (data.length > 0) setCurrentIndex(Math.floor(data.length / 2));
    }
    setIsLoading(false);
  };

  const fetchActiveBackground = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("app_backgrounds")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    if (data) setActiveBackground(data.background_value);
  };

  const goTo = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating || years.length === 0) return;
      setIsAnimating(true);
      if (direction === "left" && currentIndex < years.length - 1) {
        setCurrentIndex((p) => p + 1);
      } else if (direction === "right" && currentIndex > 0) {
        setCurrentIndex((p) => p - 1);
      }
      setTimeout(() => setIsAnimating(false), 350);
    },
    [currentIndex, isAnimating, years.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo("right"); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goTo("left"); }
      else if (e.key === "Enter" && years[currentIndex]) {
        e.preventDefault();
        navigate(`/year/${years[currentIndex].id}`);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goTo, currentIndex, navigate, years]);

  useEffect(() => {
    let gestureTriggered = false;

    const onTouchStart = (e: TouchEvent) => {
      dragStartX.current = e.touches[0].clientX;
      dragStartY.current = e.touches[0].clientY;
      isDragging.current = true;
      gestureAxis.current = null;
      gestureTriggered = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDragging.current || gestureTriggered || isAnimating) return;
      const dx = e.touches[0].clientX - dragStartX.current;
      const dy = e.touches[0].clientY - dragStartY.current;
      if (!gestureAxis.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        gestureAxis.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }
      if (gestureAxis.current === "horizontal" && Math.abs(dx) > 50) {
        gestureTriggered = true;
        goTo(dx > 0 ? "right" : "left");
      }
    };

    const onTouchEnd = () => {
      isDragging.current = false;
      gestureAxis.current = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimating) return;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = horizontal ? e.deltaX : e.deltaY;
      if (Math.abs(delta) > 20) goTo(delta > 0 ? "left" : "right");
    };

    const prevent = (e: Event) => e.preventDefault();

    document.addEventListener("touchstart", onTouchStart, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("scroll", prevent, { passive: false });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("scroll", prevent);
    };
  }, [goTo, isAnimating]);

  const getPosition = (index: number): "left" | "center" | "right" | "hidden" => {
    if (index === currentIndex - 1) return "left";
    if (index === currentIndex) return "center";
    if (index === currentIndex + 1) return "right";
    return "hidden";
  };

  if (isLoading) {
    return (
      <div className="relative h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="text-white/80 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div className="relative h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="text-center text-white/80">
          <h2 className="text-xl font-semibold mb-2">No years yet</h2>
          <p className="text-white/50 text-sm">This timeline is empty</p>
        </div>
      </div>
    );
  }

  const activeYear = years[currentIndex];
  const backgroundStyle = activeBackground
    ? { backgroundImage: `url(${activeBackground})`, backgroundSize: "cover", backgroundPosition: "center" }
    : activeYear?.background_type === "image" && activeYear?.background_value
    ? { backgroundImage: `url(${activeYear.background_value})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" };

  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden" style={backgroundStyle}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full h-full flex items-center justify-center z-10">
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
                onClick={() => navigate(`/year/${year.id}`)}
                onDoubleClick={() => navigate(`/year/${year.id}`)}
                imageUrl={imageUrl}
                onSwipeOut={(d) => goTo(d)}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
