import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

const ONBOARDING_KEY = "kiko_onboarded_v3";

interface OnboardingProps {
  forcePlay?: boolean;
  onComplete?: () => void;
}

export const Onboarding = ({ forcePlay = false, onComplete }: OnboardingProps) => {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const lastTapRef = useRef(0);

  const finish = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setActive(false);
    onComplete?.();
  }, [onComplete]);

  const nextStep = useCallback(() => {
    setStep((s) => {
      if (s >= 4) { finish(); return s; }
      return s + 1;
    });
  }, [finish]);

  // First-time auto-run
  useEffect(() => {
    if (forcePlay) return;
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setStep(0);
      setActive(true);
    }
  }, []);

  // Replay via help icon
  useEffect(() => {
    if (forcePlay) {
      setStep(0);
      setActive(true);
    }
  }, [forcePlay]);

  // Step 1 (index 1): detect vertical scroll/swipe to advance
  useEffect(() => {
    if (!active || step !== 1) return;

    let scrolled = false;
    const advance = () => {
      if (scrolled) return;
      scrolled = true;
      setTimeout(() => nextStep(), 300);
    };

    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      if (Math.abs(e.touches[0].clientY - startY) > 40) advance();
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 30) advance();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("wheel", onWheel);
    };
  }, [active, step, nextStep]);

  // Step 2 (index 2): detect double-tap/double-click anywhere to advance
  useEffect(() => {
    if (!active || step !== 2) return;

    let tapped = false;
    const advance = () => {
      if (tapped) return;
      tapped = true;
      setTimeout(() => nextStep(), 250);
    };

    const onPointer = () => {
      const now = Date.now();
      if (now - lastTapRef.current < 350) advance();
      lastTapRef.current = now;
    };

    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [active, step, nextStep]);

  if (!active) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[150] flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Backdrop — lighter for steps 1-3 so app is visible behind */}
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundColor: step === 0 || step === 4 ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.55)" }}
          transition={{ duration: 0.4 }}
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        />

        {/* Step content */}
        <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center">
          <AnimatePresence mode="wait">

            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <motion.div
                key="welcome"
                className="flex flex-col items-center text-center gap-5"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="text-5xl mb-1">✨</div>
                <div>
                  <h1 className="text-white text-2xl font-bold tracking-tight mb-3">
                    Welcome to Kiko
                  </h1>
                  <p className="text-white/65 text-sm leading-relaxed">
                    Kiko is a cinematic storytelling platform where creators share stories through visual timelines.
                  </p>
                  <p className="text-white/45 text-xs leading-relaxed mt-2">
                    Explore creators, open story cards, and discover moments.
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full mt-2">
                  <button
                    onClick={nextStep}
                    className="w-full py-3.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold transition-all active:scale-95 border border-white/20"
                  >
                    Start Exploring
                  </button>
                  <button
                    onClick={finish}
                    className="w-full py-2.5 text-white/40 hover:text-white/60 text-xs transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Scroll to explore ── */}
            {step === 1 && (
              <motion.div
                key="scroll"
                className="flex flex-col items-center text-center gap-6"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Animated card + arrows */}
                <div className="relative flex flex-col items-center gap-2">
                  <motion.div
                    className="text-white/50"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronUp className="w-6 h-6" />
                  </motion.div>

                  <motion.div
                    className="w-20 h-28 rounded-2xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.06) 100%)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                    }}
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  />

                  <motion.div
                    className="text-white/50"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  >
                    <ChevronDown className="w-6 h-6" />
                  </motion.div>
                </div>

                <div>
                  <h2 className="text-white text-lg font-semibold mb-1.5">Scroll to explore creators</h2>
                  <p className="text-white/50 text-xs leading-relaxed">Swipe up or down to discover new creators.</p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <p className="text-white/30 text-[11px] tracking-wide">Try it now, or press Next</p>
                  <button
                    onClick={nextStep}
                    className="w-full py-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-medium transition-all active:scale-95 border border-white/15"
                  >
                    Next →
                  </button>
                  <button onClick={finish} className="w-full py-2 text-white/35 hover:text-white/55 text-xs transition-colors">
                    Skip
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Double tap a card ── */}
            {step === 2 && (
              <motion.div
                key="double-tap"
                className="flex flex-col items-center text-center gap-6"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Pulsing card + tap dots */}
                <div className="relative">
                  <motion.div
                    className="w-20 h-28 rounded-2xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 100%)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                    }}
                    animate={{ scale: [1, 1.05, 1, 1.05, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Double-tap finger indicator */}
                  <motion.div
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  </motion.div>
                </div>

                <div>
                  <h2 className="text-white text-lg font-semibold mb-1.5">Double tap a card to enter a story</h2>
                  <p className="text-white/50 text-xs leading-relaxed">Each card opens a visual timeline of moments.</p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <p className="text-white/30 text-[11px] tracking-wide">Double tap anywhere, or press Next</p>
                  <button
                    onClick={nextStep}
                    className="w-full py-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-medium transition-all active:scale-95 border border-white/15"
                  >
                    Next →
                  </button>
                  <button onClick={finish} className="w-full py-2 text-white/35 hover:text-white/55 text-xs transition-colors">
                    Skip
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Swipe through moments ── */}
            {step === 3 && (
              <motion.div
                key="swipe"
                className="flex flex-col items-center text-center gap-6"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Three cards with swipe animation */}
                <div className="relative flex items-center justify-center h-32 w-52">
                  {/* Left ghost */}
                  <div
                    className="absolute w-12 h-20 rounded-xl opacity-30"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      left: 0,
                    }}
                  />
                  {/* Center card */}
                  <motion.div
                    className="w-20 h-28 rounded-2xl z-10"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 100%)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                    }}
                    animate={{ x: [0, -24, 0, 24, 0], rotateZ: [0, -2, 0, 2, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Right ghost */}
                  <div
                    className="absolute w-12 h-20 rounded-xl opacity-30"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      right: 0,
                    }}
                  />
                </div>

                <div>
                  <h2 className="text-white text-lg font-semibold mb-1.5">Swipe through moments inside a story</h2>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Once inside a creator's story, swipe left or right to browse through cards.
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={nextStep}
                    className="w-full py-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-medium transition-all active:scale-95 border border-white/15"
                  >
                    Next →
                  </button>
                  <button onClick={finish} className="w-full py-2 text-white/35 hover:text-white/55 text-xs transition-colors">
                    Skip
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: You're ready ── */}
            {step === 4 && (
              <motion.div
                key="ready"
                className="flex flex-col items-center text-center gap-5"
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <motion.div
                  className="text-5xl"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  🎬
                </motion.div>
                <div>
                  <h1 className="text-white text-2xl font-bold tracking-tight mb-3">
                    You're ready to explore Kiko
                  </h1>
                  <p className="text-white/55 text-sm leading-relaxed">
                    Start discovering creators and their visual stories.
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full mt-2">
                  <button
                    onClick={finish}
                    className="w-full py-3.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-white text-sm font-semibold transition-all active:scale-95 border border-white/20"
                  >
                    Continue
                  </button>
                  <button
                    onClick={finish}
                    className="w-full py-2.5 text-white/40 hover:text-white/60 text-xs transition-colors"
                  >
                    Explore
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Step dots — shown on steps 1-4 */}
          {step > 0 && step < 5 && (
            <motion.div
              className="flex gap-1.5 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step ? "w-5 h-1.5 bg-white/70" : "w-1.5 h-1.5 bg-white/20"
                  }`}
                />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
