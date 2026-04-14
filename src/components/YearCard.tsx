import { motion } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface YearCardProps {
  year: string;
  position: "left" | "center" | "right";
  onClick: () => void;
  onDoubleClick?: () => void;
  imageUrl: string;
  mediaType?: "image" | "video";
  onSwipeOut?: (direction: "left" | "right") => void;
  offsetX?: number;
  onBookmarkClick?: () => void;
  isBookmarked?: boolean;
}

export const YearCard = ({
  year,
  position,
  onClick,
  onDoubleClick,
  imageUrl,
  mediaType = "image",
  onSwipeOut,
  offsetX = 0,
  onBookmarkClick,
  isBookmarked = false,
}: YearCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const lastTap = useRef(0);
  const isCenter = position === "center";

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleClick?.();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current !== 0) {
          // single tap — no-op here, handled by parent
        }
      }, 300);
    }
  }, [onDoubleClick]);

  // Play when center, pause otherwise
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isCenter) {
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked — video stays paused, no UI error shown
        });
      }
    } else {
      vid.pause();
    }
  }, [isCenter]);

  const getPositionStyles = () => {
    switch (position) {
      case "left":
        return { x: "calc(-50% - 40px)", scale: 0.82, zIndex: 10, opacity: 0.6, rotateY: 8 };
      case "center":
        return { x: "0%", scale: 1, zIndex: 30, opacity: 1, rotateY: 0 };
      case "right":
        return { x: "calc(50% + 40px)", scale: 0.82, zIndex: 10, opacity: 0.6, rotateY: -8 };
    }
  };

  const pos = getPositionStyles();

  return (
    <motion.div
      data-card
      className={cn("absolute rounded-[20px] overflow-hidden bg-neutral-900 cursor-pointer will-change-transform")}
      style={{
        width: "min(80vw, 420px)",
        aspectRatio: "3/4",
        perspective: 1200,
        boxShadow:
          position === "center"
            ? "0 30px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)"
            : "0 15px 40px -10px rgba(0,0,0,0.35)",
      }}
      initial={false}
      animate={{ x: pos.x, scale: pos.scale, zIndex: pos.zIndex, opacity: pos.opacity, rotateY: pos.rotateY }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
      onClick={position === "center" ? handleTap : onClick}
    >
      {/* ── Media layer ─────────────────────────────────────────────────────── */}
      {mediaType === "video" && !videoError ? (
        <video
          ref={videoRef}
          src={imageUrl}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload={isCenter ? "auto" : "metadata"}
          onError={() => setVideoError(true)}
          style={{ display: "block" }}
        />
      ) : (
        /* Image fallback — also shown when videoError === true */
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: videoError
              ? undefined
              : `url(${imageUrl})`,
            backgroundColor: videoError ? "#111" : undefined,
          }}
        />
      )}

      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Bookmark button — top-right, center card only */}
      {position === "center" && onBookmarkClick && (
        <button
          onClick={e => { e.stopPropagation(); onBookmarkClick(); }}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/50 transition-colors"
          title="Bookmark"
        >
          <Bookmark
            className={cn("w-3.5 h-3.5 transition-all", isBookmarked ? "text-white fill-white" : "text-white/70")}
          />
        </button>
      )}

      {/* Text overlay — center card */}
      {position === "center" && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-6 pb-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <span className="text-white/70 text-xs font-semibold tracking-[0.2em] uppercase block mb-1" style={{ fontFamily: "system-ui, sans-serif" }}>
            TIMELINE
          </span>
          <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-2" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "-0.01em" }}>
            {year}
          </h2>
          <span className="text-white/50 text-sm flex items-center gap-1.5">
            Double tap to enter
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </motion.div>
      )}

      {/* Side card text */}
      {position !== "center" && (
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="text-white/40 text-xs font-semibold tracking-[0.15em] uppercase block mb-1">TIMELINE</span>
          <h2 className="text-white/50 text-xl font-bold" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            {year}
          </h2>
        </div>
      )}
    </motion.div>
  );
};
