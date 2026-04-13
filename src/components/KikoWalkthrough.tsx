import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Onboarding } from "./Onboarding";

interface KikoWalkthroughProps {
  open: boolean;
  onClose: () => void;
}

export const KikoWalkthrough = ({ open, onClose }: KikoWalkthroughProps) => {
  const [playingGuide, setPlayingGuide] = useState(false);

  if (playingGuide) {
    return (
      <Onboarding
        forcePlay
        onComplete={() => {
          setPlayingGuide(false);
          onClose();
        }}
      />
    );
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-xs rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 25px 60px -12px rgba(0,0,0,0.4)",
          }}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
          >
            <X className="w-4 h-4 text-white/80" />
          </button>

          <div className="px-8 pt-10 pb-8 text-center">
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-white text-lg font-bold mb-2">
              Learn how Kiko works
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-8">
              Watch a quick interaction guide.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setPlayingGuide(true)}
                className="w-full py-3 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
              >
                Start guide
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full text-white/50 hover:text-white/70 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
