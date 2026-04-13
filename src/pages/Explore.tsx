import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Share2, Eye, Users, Building2 } from "lucide-react";
import { toast } from "sonner";

interface PublicProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  profile_type: string | null;
  created_at: string;
}

interface YearPreview {
  id: string;
  background_value: string | null;
}

const Explore = () => {
  const [profiles, setProfiles] = useState<(PublicProfile & { yearPreview?: YearPreview })[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicProfiles();

    // Real-time subscription
    const channel = supabase
      .channel('public-profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'gallery_privacy=eq.public'
        },
        () => {
          fetchPublicProfiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPublicProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gallery_privacy', 'public')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch year previews for each profile
      const profilesWithPreviews = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: yearData } = await supabase
            .from('years')
            .select('id, background_value')
            .eq('user_id', profile.user_id)
            .order('display_order', { ascending: false })
            .limit(1);
          
          return {
            ...profile,
            yearPreview: yearData?.[0] || undefined
          };
        })
      );

      setProfiles(profilesWithPreviews);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load galleries');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (username: string) => {
    const url = `${window.location.origin}/u/${username}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${username}'s Gallery on VisionSwipe`,
        url: url
      }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success('Gallery link copied!');
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Gallery link copied!');
    }
  };

  const handleViewGallery = (username: string) => {
    navigate(`/u/${username}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading timelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Explore Timelines
              </h1>
              <p className="text-xs text-muted-foreground">
                {profiles.length} public {profiles.length === 1 ? 'timeline' : 'timelines'}
              </p>
            </div>
          </div>
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

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 py-8">
        {profiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Public Timelines Yet</h2>
            <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
              Be the first to share your timeline with the world!
            </p>
            <Button onClick={() => navigate('/auth')} size="lg">
              Create Your Timeline
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <Card
                key={profile.id}
                className="group relative overflow-hidden backdrop-blur-xl bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10"
              >
                {/* Cover Image Preview */}
                {profile.yearPreview?.background_value && (
                  <div className="h-32 w-full overflow-hidden">
                    <img
                      src={profile.yearPreview.background_value}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 h-32 bg-gradient-to-b from-transparent to-card/90" />
                  </div>
                )}

                <div className="p-6 pt-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-background shadow-lg ${profile.yearPreview?.background_value ? '-mt-10 relative z-10' : ''}`}>
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg truncate">
                          {profile.display_name || profile.username}
                        </h3>
                        {profile.profile_type === 'business' && (
                          <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        @{profile.username}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewGallery(profile.username)}
                      className="flex-1"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Timeline
                    </Button>
                    <Button
                      onClick={() => handleShare(profile.username)}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-muted-foreground">
        Powered by VisionSwipe
      </div>
    </div>
  );
};

export default Explore;
