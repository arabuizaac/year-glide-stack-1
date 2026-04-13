import { useEffect, useRef, memo } from "react";
import { useGlobalBackground } from "@/contexts/GlobalBackgroundContext";

export const GlobalBackground = memo(() => {
  const { background, setIsLoaded } = useGlobalBackground();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video loading
  useEffect(() => {
    if (background.type === 'video' && videoRef.current) {
      const video = videoRef.current;
      
      const handleCanPlay = () => {
        setIsLoaded(true);
      };

      video.addEventListener('canplay', handleCanPlay);
      
      // If already can play, set loaded
      if (video.readyState >= 3) {
        setIsLoaded(true);
      }

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [background.type, background.value, setIsLoaded]);

  // No background set
  if (background.type === 'none') {
    return (
      <div 
        className="fixed inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"
        style={{ zIndex: -10 }}
      />
    );
  }

  // Color background
  if (background.type === 'color') {
    return (
      <div 
        className="fixed inset-0"
        style={{ 
          zIndex: -10,
          backgroundColor: background.value || '#1a1a1a'
        }}
      />
    );
  }

  // Video background - lazy loaded
  if (background.type === 'video' && background.value) {
    return (
      <>
        {/* Fallback gradient while video loads */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"
          style={{ zIndex: -11 }}
        />
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="fixed inset-0 w-full h-full object-cover"
          style={{ zIndex: -10 }}
        >
          <source src={background.value} type="video/mp4" />
        </video>
      </>
    );
  }

  // Image background
  if (background.type === 'image' && background.value) {
    return (
      <>
        {/* Fallback gradient while image loads */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"
          style={{ zIndex: -11 }}
        />
        <img
          src={background.value}
          alt=""
          className="fixed inset-0 w-full h-full object-cover"
          style={{ zIndex: -10 }}
          onLoad={() => setIsLoaded(true)}
          loading="eager"
        />
      </>
    );
  }

  // Default fallback
  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900"
      style={{ zIndex: -10 }}
    />
  );
});

GlobalBackground.displayName = 'GlobalBackground';
