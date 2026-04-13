import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Image, Video, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGlobalBackground } from "@/contexts/GlobalBackgroundContext";

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  duration?: number;
  media_type: 'image' | 'video' | 'audio';
}

const MonthGallery = () => {
  const { yearId, monthId } = useParams();
  const navigate = useNavigate();
  const [monthName, setMonthName] = useState("");
  const [yearName, setYearName] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setBackground } = useGlobalBackground();

  // Set background from month or year data
  useEffect(() => {
    const fetchAndSetBackground = async () => {
      if (!monthId || !yearId) return;

      // Try to get month background first
      const { data: monthData } = await supabase
        .from('months')
        .select('background_type, background_value, user_id')
        .eq('id', monthId)
        .single();

      if (monthData?.background_type && monthData?.background_value) {
        setBackground({
          type: monthData.background_type as 'image' | 'video' | 'color',
          value: monthData.background_value
        });
        return;
      }

      // Fallback to year background
      const { data: yearData } = await supabase
        .from('years')
        .select('background_type, background_value, user_id')
        .eq('id', yearId)
        .single();

      if (yearData?.background_type && yearData?.background_value) {
        setBackground({
          type: yearData.background_type as 'image' | 'video' | 'color',
          value: yearData.background_value
        });
        return;
      }

      // Fallback to app background for the user
      if (monthData?.user_id || yearData?.user_id) {
        const userId = monthData?.user_id || yearData?.user_id;
        const { data: bgData } = await supabase
          .from('app_backgrounds')
          .select('background_type, background_value')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        if (bgData?.background_type && bgData?.background_value) {
          setBackground({
            type: bgData.background_type as 'image' | 'video' | 'color',
            value: bgData.background_value
          });
          return;
        }
      }

      // Default background
      setBackground({ type: 'none', value: null });
    };

    fetchAndSetBackground();
  }, [monthId, yearId, setBackground]);

  useEffect(() => {
    fetchData();
  }, [monthId, yearId]);

  const fetchData = async () => {
    if (!monthId || !yearId) return;

    // Fetch month details
    const { data: monthData, error: monthError } = await supabase
      .from('months')
      .select('name')
      .eq('id', monthId)
      .single();

    if (monthError) {
      toast({
        title: "Error",
        description: "Failed to fetch month details.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setMonthName(monthData.name);

    // Fetch year details
    const { data: yearData, error: yearError } = await supabase
      .from('years')
      .select('name')
      .eq('id', yearId)
      .single();

    if (!yearError && yearData) {
      setYearName(yearData.name);
    }

    // Fetch media items
    const { data: mediaData, error: mediaError } = await supabase
      .from('media')
      .select('*')
      .eq('parent_id', monthId)
      .eq('parent_type', 'month')
      .order('display_order', { ascending: true });

    if (mediaError) {
      toast({
        title: "Error",
        description: "Failed to fetch media.",
        variant: "destructive",
      });
    } else {
      setMediaItems((mediaData || []) as MediaItem[]);
    }

    setIsLoading(false);
  };

  const images = mediaItems.filter(m => m.media_type === 'image');
  const videos = mediaItems.filter(m => m.media_type === 'video');
  const audios = mediaItems.filter(m => m.media_type === 'audio');

  // Only include sections that have media
  const allSections = [
    {
      id: 'images',
      title: 'Images',
      icon: Image,
      items: images,
      iconBg: 'bg-[#6B8BFF]'
    },
    {
      id: 'videos',
      title: 'Videos',
      icon: Video,
      items: videos,
      iconBg: 'bg-[#6B8BFF]'
    },
    {
      id: 'audio',
      title: 'Podcasts & Audio',
      icon: Headphones,
      items: audios,
      iconBg: 'bg-gradient-to-br from-[#D946EF] to-[#A855F7]'
    }
  ];

  const sections = allSections.filter(section => section.items.length > 0);

  const handleCardClick = (item: MediaItem) => {
    console.log('Card clicked:', item);
  };

  const handleBackClick = () => {
    navigate(`/year/${yearId}`);
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCards = (items: MediaItem[], section: typeof allSections[0]) => (
    <div className="space-y-4 sm:space-y-6">
      {items.map((item, itemIndex) => (
        <div
          key={item.id}
          className="cursor-pointer group animate-fade-in"
          style={{ animationDelay: `${itemIndex * 0.05}s` }}
        >
          <div className="bg-white/70 backdrop-blur-md rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:scale-[1.02] border border-white/20">
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              {item.media_type === 'audio' ? (
                <div className="relative w-full h-full">
                  <div className={`${section.iconBg} w-full h-full flex items-center justify-center`}>
                    <Headphones className="w-16 h-16 sm:w-20 sm:h-20 text-white opacity-90" />
                  </div>
                  <audio
                    src={item.media_url}
                    controls
                    className="absolute bottom-0 left-0 right-0 w-full"
                    style={{ height: '40px' }}
                  />
                </div>
              ) : item.media_type === 'video' ? (
                <video
                  src={item.media_url}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
              ) : (
                <img
                  src={item.media_url}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              
              {item.duration && item.media_type !== 'video' && (
                <div className="absolute bottom-3 right-3 bg-black/90 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {formatDuration(item.duration)}
                </div>
              )}
              
              {item.media_type === 'image' && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </div>

            <div className="p-4 sm:p-5 bg-white/50 backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 group-hover:text-[#6B8BFF] transition-colors line-clamp-2">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl text-white/80">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen animate-fade-in flex flex-col overflow-hidden">
      {/* Backdrop blur layer - only blurs the background behind the gallery content */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        style={{ 
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)'
        }}
      />
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Content container */}
      <div className="relative z-10 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-sm z-10 shadow-sm flex-shrink-0">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="text-foreground hover:bg-secondary rounded-full px-4 sm:px-6 py-2 sm:py-3 transition-all"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Back to Months</span>
          <span className="sm:hidden">Back</span>
        </Button>
        
        <div className="bg-white rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-sm border border-border">
          <h1 className="text-base sm:text-xl font-semibold text-foreground capitalize">
            {monthName} {yearName}
          </h1>
        </div>
      </div>

      {/* Gallery Content */}
      {sections.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center py-16 text-muted-foreground bg-white/70 backdrop-blur-md rounded-2xl shadow-lg max-w-md">
            <Image className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No media yet</p>
            <p className="text-sm mt-1 opacity-60">Upload media in the editor to see it here</p>
          </div>
        </div>
      ) : isMobile ? (
        /* Mobile: Tabbed Interface - Only show tabs for sections with media */
        <div className="flex-1 px-4 py-6 overflow-hidden flex flex-col">
          <Tabs defaultValue={sections[0].id} className="w-full flex-1 flex flex-col overflow-hidden">
            <TabsList className={`grid w-full mb-6 flex-shrink-0`} style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
              {sections.map(section => (
                <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {sections.map(section => (
              <TabsContent key={section.id} value={section.id} className="flex-1 mt-0 overflow-y-auto scroll-smooth" style={{ scrollSnapType: 'y proximity' }}>
                <div style={{ scrollSnapAlign: 'start' }}>
                  {renderCards(section.items, section)}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      ) : (
        /* Desktop: Dynamic Columns with Independent Scrolling - Only show columns with media */
        <div className={`flex-1 grid gap-6 px-6 py-8 overflow-hidden`} style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map((section, index) => {
            const headerAlignment = index === 0 ? 'justify-end' : index === sections.length - 1 ? 'justify-start' : 'justify-center';
            return (
              <div key={section.id} className="flex flex-col overflow-hidden h-full">
                <div className={`flex items-center gap-3 mb-6 flex-shrink-0 ${headerAlignment}`}>
                  {index === 0 && <h2 className="text-xl font-bold text-foreground">{section.title}</h2>}
                  <div className={`${section.iconBg} p-2.5 rounded-full shadow-md`}>
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  {index !== 0 && <h2 className="text-xl font-bold text-foreground">{section.title}</h2>}
                </div>
                <div className="flex-1 overflow-y-auto scroll-smooth pr-4" style={{ scrollSnapType: 'y proximity' }}>
                  {renderCards(section.items, section)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};

export default MonthGallery;
