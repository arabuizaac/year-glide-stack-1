import { useState, useCallback, useRef } from "react";

const DOUBLE_TAP_DELAY = 300;

export const useImmersiveMode = () => {
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Unified double-tap/double-click toggle — works on touch + mouse
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < DOUBLE_TAP_DELAY && timeSinceLastTap > 50) {
      setIsImmersiveMode(prev => !prev);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    // No-op: immersive mode only toggles via explicit double-tap
  }, []);

  return {
    isImmersiveMode,
    setIsImmersiveMode,
    resetIdleTimer,
    handleDoubleTap
  };
};
