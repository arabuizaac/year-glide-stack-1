import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, Eye, Save, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EditorControlBarProps {
  isLiveMode: boolean;
  onToggleLiveMode: (enabled: boolean) => void;
  lastAutoSaved?: string | null;
  isSaving?: boolean;
  userId?: string;
}

export const EditorControlBar = ({ 
  isLiveMode, 
  onToggleLiveMode,
  lastAutoSaved,
  isSaving = false,
  userId
}: EditorControlBarProps) => {
  const { toast } = useToast();
  const [lastPublished, setLastPublished] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchPublishStatus();
    }
  }, [userId]);

  const fetchPublishStatus = async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_published, gallery_privacy')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setIsPublished(data.is_published || false);
      setIsPublic(data.gallery_privacy === 'public');
    }
  };

  const updateTimestamp = () => {
    const now = new Date();
    setLastPublished(now.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    }));
  };

  const validateTimeline = async (): Promise<{ valid: boolean; error?: string }> => {
    if (!userId) {
      return { valid: false, error: "User not authenticated" };
    }

    // Check if at least one year exists
    const { data: years, error: yearsError } = await supabase
      .from('years')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (yearsError) {
      return { valid: false, error: "Failed to check years" };
    }

    if (!years || years.length === 0) {
      return { valid: false, error: "Please add at least one year before publishing" };
    }

    return { valid: true };
  };

  const handlePublish = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to publish",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    
    try {
      // Validate timeline has required content
      const validation = await validateTimeline();
      
      if (!validation.valid) {
        toast({
          title: "Cannot Publish",
          description: validation.error,
          variant: "destructive",
        });
        setIsPublishing(false);
        return;
      }

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            username: `user_${userId.substring(0, 8)}`,
            display_name: 'User',
            is_published: true,
            gallery_privacy: isPublic ? 'public' : 'private',
          });

        if (insertError) {
          console.error('Profile insert error:', insertError);
          throw insertError;
        }
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            is_published: true,
            gallery_privacy: isPublic ? 'public' : 'private',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Profile update error:', updateError);
          throw updateError;
        }
      }
      
      updateTimestamp();
      setIsPublished(true);
      
      toast({
        title: "🎉 Timeline Published!",
        description: isPublic 
          ? "Your timeline is now live and visible to everyone!" 
          : "Your timeline is published but only accessible via direct link.",
      });
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "Publish Failed",
        description: "There was an error publishing your timeline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePrivacyToggle = async (makePublic: boolean) => {
    if (!userId) return;

    setIsPublic(makePublic);

    // If already published, update privacy setting immediately
    if (isPublished) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          gallery_privacy: makePublic ? 'public' : 'private',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating privacy:', error);
        toast({
          title: "Error",
          description: "Failed to update privacy setting",
          variant: "destructive",
        });
        setIsPublic(!makePublic); // Revert
        return;
      }

      toast({
        title: makePublic ? "Timeline is Public" : "Timeline is Private",
        description: makePublic 
          ? "Your timeline is now visible in discovery" 
          : "Your timeline is now only accessible via direct link",
      });
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="live-mode"
              checked={isLiveMode}
              onCheckedChange={onToggleLiveMode}
            />
            <Label htmlFor="live-mode" className="flex items-center gap-2 cursor-pointer">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Live Preview</span>
            </Label>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center gap-2 border-l pl-4 border-neutral-200">
            <Switch
              id="privacy-toggle"
              checked={isPublic}
              onCheckedChange={handlePrivacyToggle}
            />
            <Label htmlFor="privacy-toggle" className="text-sm cursor-pointer">
              <span className={`${isPublic ? 'text-green-600' : 'text-amber-600'} font-medium`}>
                {isPublic ? 'Public' : 'Private'}
              </span>
            </Label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto-save Status */}
          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Save className="w-3 h-3 animate-pulse" />
              <span className="hidden sm:inline">Saving...</span>
            </div>
          )}
          {!isSaving && lastAutoSaved && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              💾 Saved: {lastAutoSaved}
            </span>
          )}
          
          {/* Publish Status */}
          {isPublished && (
            <div className="flex items-center gap-1 text-xs text-green-600 hidden md:flex">
              <Check className="w-3 h-3" />
              <span>Published</span>
            </div>
          )}
          
          {/* Last Published */}
          {lastPublished && (
            <span className="text-xs text-neutral-500 hidden md:block">
              {lastPublished}
            </span>
          )}
          
          <span className="text-xs text-neutral-500 hidden lg:block">
            Powered by VisionSwipe
          </span>
          
          <Button 
            onClick={handlePublish} 
            disabled={isPublishing}
            className="rounded-xl"
            variant={isPublished ? "outline" : "default"}
          >
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">
              {isPublishing ? "Publishing..." : isPublished ? "Update" : "Publish"}
            </span>
            <span className="sm:hidden">
              {isPublishing ? "..." : isPublished ? "Update" : "Publish"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};
