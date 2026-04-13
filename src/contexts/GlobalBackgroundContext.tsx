import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface BackgroundData {
  type: 'image' | 'video' | 'color' | 'none';
  value: string | null;
}

interface GlobalBackgroundContextType {
  background: BackgroundData;
  setBackground: (bg: BackgroundData) => void;
  isLoaded: boolean;
  setIsLoaded: (loaded: boolean) => void;
}

const GlobalBackgroundContext = createContext<GlobalBackgroundContextType | undefined>(undefined);

export const GlobalBackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [background, setBackgroundState] = useState<BackgroundData>({ type: 'none', value: null });
  const [isLoaded, setIsLoaded] = useState(false);

  const setBackground = useCallback((bg: BackgroundData) => {
    setBackgroundState(bg);
    // Reset loaded state when background changes
    if (bg.type !== 'none' && bg.type !== 'color') {
      setIsLoaded(false);
    } else {
      setIsLoaded(true);
    }
  }, []);

  return (
    <GlobalBackgroundContext.Provider value={{ background, setBackground, isLoaded, setIsLoaded }}>
      {children}
    </GlobalBackgroundContext.Provider>
  );
};

export const useGlobalBackground = () => {
  const context = useContext(GlobalBackgroundContext);
  if (!context) {
    throw new Error('useGlobalBackground must be used within GlobalBackgroundProvider');
  }
  return context;
};
