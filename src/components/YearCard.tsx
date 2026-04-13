import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const lastTap = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleClick?.();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current !== 0) {
          // single tap — no-op
        }
      }, 300);
    }
  }, [onDoubleClick]);

  const toggleVideo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

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
      {/* Media */}
      {mediaType === "video" ? (
        <video
          ref={videoRef}
          src={imageUrl}
          className="absolute inset-0 w-full h-full object-cover"
          loop muted playsInline preload="metadata"
        />
      ) : (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
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

      {/* Video play overlay */}
      {mediaType === "video" && position === "center" && (
        <button
          onClick={toggleVideo}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          {isPlaying ? (
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-white rounded-full" />
              <div className="w-1 h-4 bg-white rounded-full" />
            </div>
          ) : (
            <svg className="w-5 h-5 text-white ml-0.5" fill="white" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}
    </motion.div>
  );
};
