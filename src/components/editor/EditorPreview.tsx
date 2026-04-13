import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { YearCard } from "@/components/YearCard";
import { AnimatePresence, motion } from "framer-motion";

interface EditorPreviewProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  userId?: string;
}

interface Year {
  id: string;
  name: string;
  background_type: string | null;
  background_value: string | null;
  display_order: number | null;
}

interface AppBackground {
  id: string;
  background_type: string;
  background_value: string | null;
  is_active: boolean;
}

export const EditorPreview = ({ isVisible, onToggleVisibility, userId }: EditorPreviewProps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [years, setYears] = useState<Year[]>([]);
  const [activeBackground, setActiveBackground] = useState<AppBackground | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Fetch years
    const { data: yearsData } = await supabase
      .from('years')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (yearsData) {
      setYears(yearsData);
      if (yearsData.length > 0 && currentIndex >= yearsData.length) {
        setCurrentIndex(Math.floor(yearsData.length / 2));
      } else if (yearsData.length > 0 && currentIndex === 0) {
        setCurrentIndex(Math.floor(yearsData.length / 2));
      }
    }

    // Fetch active background
    const { data: bgData } = await supabase
      .from('app_backgrounds')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (bgData) {
      setActiveBackground(bgData);
    } else {
      setActiveBackground(null);
    }

    setIsLoading(false);
  }, [userId, currentIndex]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Set up real-time subscription for instant sync
  useEffect(() => {
    if (!userId) return;

    const yearsChannel = supabase
      .channel('editor-preview-years')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'years',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    const bgChannel = supabase
      .channel('editor-preview-backgrounds')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_backgrounds',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(yearsChannel);
      supabase.removeChannel(bgChannel);
    };
  }, [userId, fetchData]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSwipe = useCallback((direction: "up" | "down") => {
    if (isAnimating || years.length === 0) return;
    
    setIsAnimating(true);
    
    if (direction === "up" && currentIndex < years.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === "down" && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    
    setTimeout(() => setIsAnimating(false), 400);
  }, [currentIndex, isAnimating, years.length]);

  const getCardPosition = (index: number): "left" | "center" | "right" | "hidden" => {
    if (index === currentIndex - 1) return "left";
    if (index === currentIndex) return "center";
    if (index === currentIndex + 1) return "right";
    return "hidden";
  };

  if (!isVisible) {
    return (
      <div className="hidden lg:flex items-center justify-center bg-neutral-100 border-l border-neutral-200">
        <Button onClick={onToggleVisibility} variant="outline" size="lg">
          <Eye className="w-4 h-4 mr-2" />
          Show Preview
        </Button>
      </div>
    );
  }

  const isVideoBackground = activeBackground?.background_type === 'video' && activeBackground?.background_value;
  const isImageBackground = activeBackground?.background_type === 'image' && activeBackground?.background_value;
  const activeYear = years[currentIndex];
  const yearVideoBackground = activeYear?.background_type === 'video' && activeYear?.background_value;
  const yearImageBackground = activeYear?.background_type === 'image' && activeYear?.background_value;

  return (
    <div className="h-full bg-white border-l border-neutral-200 flex flex-col">
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-800">Live Preview</h3>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={onToggleVisibility} variant="ghost" size="sm" className="lg:hidden">
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            {isVideoBackground ? (
              <motion.video
                key={`video-${activeBackground.background_value}`}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <source src={activeBackground.background_value!} type="video/mp4" />
              </motion.video>
            ) : isImageBackground ? (
              <motion.img
                key={`image-${activeBackground.background_value}`}
                src={activeBackground.background_value!}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            ) : yearVideoBackground ? (
              <motion.video
                key={`year-video-${activeYear.background_value}`}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <source src={activeYear.background_value!} type="video/mp4" />
              </motion.video>
            ) : yearImageBackground ? (
              <motion.img
                key={`year-image-${activeYear.background_value}`}
                src={activeYear.background_value!}
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
            )}
          </AnimatePresence>
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 z-[1]" />

        {/* Content */}
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {isLoading ? (
            <motion.div 
              className="text-white/80 text-sm"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading preview...
            </motion.div>
          ) : years.length === 0 ? (
            <div className="text-center text-white/80 p-4">
              <p className="text-sm">No timelines yet</p>
              <p className="text-xs text-white/50 mt-1">Add a timeline to see preview</p>
            </div>
          ) : (
            <div 
              className="relative flex items-center justify-center"
              style={{ 
                width: '85%',
                maxWidth: '280px',
                height: '70%'
              }}
            >
              <AnimatePresence mode="popLayout">
                {years.map((year, index) => {
                  const position = getCardPosition(index);
                  if (position === "hidden") return null;
                  
                  const imageUrl = year.background_type === 'image' && year.background_value
                    ? year.background_value
                    : 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=500&fit=crop';
                  
                  return (
                    <YearCard
                      key={year.id}
                      year={year.name}
                      position={position}
                      onClick={() => {}}
                      imageUrl={imageUrl}
                      onSwipeOut={() => {}}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Preview controls */}
        {years.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            <button
              onClick={() => handleSwipe("down")}
              disabled={currentIndex === 0}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 flex items-center justify-center text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => handleSwipe("up")}
              disabled={currentIndex === years.length - 1}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 flex items-center justify-center text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}

        {/* Year indicator dots */}
        {years.length > 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
            {years.map((_, index) => (
              <div
                key={index}
                className={`w-1 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'h-4 bg-white' 
                    : 'h-1 bg-white/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
