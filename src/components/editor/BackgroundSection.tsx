import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Image as ImageIcon, Video as VideoIcon } from "lucide-react";

interface BackgroundSectionProps {
  userId: string;
}

export const BackgroundSection = ({ userId }: BackgroundSectionProps) => {
  const [backgrounds, setBackgrounds] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [backgroundType, setBackgroundType] = useState<'image' | 'video'>('image');
  const { toast } = useToast();

  useEffect(() => {
    fetchBackgrounds();
  }, [userId]);

  const fetchBackgrounds = async () => {
    const { data, error } = await supabase
      .from('app_backgrounds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch backgrounds.",
        variant: "destructive",
      });
    } else {
      setBackgrounds(data || []);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vision-swipe-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vision-swipe-media')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('app_backgrounds')
        .insert({
          user_id: userId,
          background_type: backgroundType,
          background_value: publicUrl,
          is_active: backgrounds.length === 0 // Set as active if it's the first one
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Background uploaded successfully.",
      });

      fetchBackgrounds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload background.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      // Deactivate all backgrounds
      await supabase
        .from('app_backgrounds')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Activate selected background
      const { error } = await supabase
        .from('app_backgrounds')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Background set as active.",
      });

      fetchBackgrounds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to set background as active.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, backgroundValue: string) => {
    try {
      // Delete from storage
      const fileName = backgroundValue.split('/').slice(-2).join('/');
      await supabase.storage
        .from('vision-swipe-media')
        .remove([fileName]);

      // Delete from database
      const { error } = await supabase
        .from('app_backgrounds')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Background deleted successfully.",
      });

      fetchBackgrounds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete background.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">App Background</h2>
        <p className="text-neutral-600 mb-6">
          Upload an image or video to display as the background behind your year cards on the main VisionSwipe screen.
        </p>

        <div className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={backgroundType === 'image' ? 'default' : 'outline'}
              onClick={() => setBackgroundType('image')}
              className="flex-1"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Image
            </Button>
            <Button
              variant={backgroundType === 'video' ? 'default' : 'outline'}
              onClick={() => setBackgroundType('video')}
              className="flex-1"
            >
              <VideoIcon className="w-4 h-4 mr-2" />
              Video
            </Button>
          </div>

          <div>
            <Label htmlFor="background-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 hover:border-neutral-400 transition-colors text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                <p className="text-sm text-neutral-600">
                  Click to upload {backgroundType === 'image' ? 'an image' : 'a video'}
                </p>
              </div>
            </Label>
            <Input
              id="background-upload"
              type="file"
              accept={backgroundType === 'image' ? 'image/*' : 'video/*'}
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Backgrounds List */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Your Backgrounds</h3>
        {backgrounds.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No backgrounds uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {backgrounds.map((bg) => (
              <div
                key={bg.id}
                className={`relative rounded-xl overflow-hidden ${
                  bg.is_active ? 'ring-4 ring-blue-500' : ''
                }`}
              >
                {bg.background_type === 'image' ? (
                  <img
                    src={bg.background_value}
                    alt="Background"
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <video
                    src={bg.background_value}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex gap-2">
                    {!bg.is_active && (
                      <Button
                        size="sm"
                        onClick={() => handleSetActive(bg.id)}
                        className="flex-1"
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(bg.id, bg.background_value)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {bg.is_active && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Active
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
