import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Home, Share2, ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { YearStackContainer } from "@/components/YearStackContainer";

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  gallery_privacy: string;
  is_published: boolean;
}

const PublicGallery = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notPublished, setNotPublished] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      // First try to get profile by username - owner can always see their own
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;

      // Get profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // If it's the owner viewing their own profile, show it
      if (currentUserId && data.user_id === currentUserId) {
        setProfile(data);
        setLoading(false);
        return;
      }

      // For non-owners:
      // If not published, show not published message
      if (!data.is_published) {
        setNotPublished(true);
        setLoading(false);
        return;
      }

      // If published (regardless of privacy setting), show the timeline
      // Privacy only affects whether it appears in discovery/explore
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${profile?.display_name || profile?.username}'s Timeline`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Gallery link copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-white/60">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-6 p-8 backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Timeline Not Found</h2>
            <p className="text-white/60">
              This timeline doesn't exist or has been removed.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/explore')} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Explore Timelines
            </Button>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (notPublished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-6 p-8 backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white/60" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Timeline Not Published</h2>
            <p className="text-white/60">
              The owner hasn't published this timeline yet.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/explore')} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Explore Timelines
            </Button>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="relative h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/explore')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">
                    {profile.display_name || profile.username}
                  </h2>
                  {profile.gallery_privacy === 'private' && (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="rounded-full"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="h-full pt-16">
        <YearStackContainer userId={profile.user_id} isPublicView />
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 z-50">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-neutral-400 hover:text-neutral-500 transition-colors cursor-pointer"
          style={{ fontSize: '10px' }}
        >
          Powered by VisionSwipe
        </button>
      </div>
    </div>
  );
};

export default PublicGallery;
