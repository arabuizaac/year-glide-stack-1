import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface YearsSectionProps {
  userId: string;
  onYearSelect: (yearId: string) => void;
}

export const YearsSection = ({ userId, onYearSelect }: YearsSectionProps) => {
  const [years, setYears] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [yearName, setYearName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchYears();
  }, [userId]);

  const fetchYears = async () => {
    const { data, error } = await supabase
      .from('years')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch years.",
        variant: "destructive",
      });
    } else {
      setYears(data || []);
    }
  };

  const handleAddYear = async () => {
    if (!yearName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a year name.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate year name
    const duplicate = years.find(y => y.name.toLowerCase() === yearName.trim().toLowerCase());
    if (duplicate) {
      toast({
        title: "Error",
        description: "A year with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let backgroundValue = null;
      let backgroundType = 'color';

      if (coverFile) {
        // Upload file
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${userId}/years/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vision-swipe-media')
          .upload(fileName, coverFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vision-swipe-media')
          .getPublicUrl(fileName);

        backgroundValue = publicUrl;
        backgroundType = mediaType;
      }

      const { error } = await supabase
        .from('years')
        .insert({
          user_id: userId,
          name: yearName.trim(),
          background_type: backgroundType,
          background_value: backgroundValue,
          display_order: years.length
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timeline created successfully.",
      });

      setIsOpen(false);
      setYearName("");
      setCoverFile(null);
      fetchYears();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add year.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteYear = async (id: string, backgroundValue: string | null) => {
    try {
      if (backgroundValue) {
        const fileName = backgroundValue.split('/').slice(-3).join('/');
        await supabase.storage
          .from('vision-swipe-media')
          .remove([fileName]);
      }

      const { error } = await supabase
        .from('years')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timeline deleted successfully.",
      });

      fetchYears();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete year.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">Timelines</h2>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create a new timeline
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a new timeline</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="year-name">Timeline Name</Label>
                  <Input
                    id="year-name"
                    placeholder="e.g., 2024"
                    value={yearName}
                    onChange={(e) => setYearName(e.target.value)}
                    className="rounded-xl mt-2"
                  />
                </div>

                <div>
                  <Label>Cover Media (Optional)</Label>
                  <div className="flex gap-2 mt-2">
                    <Button type="button" variant={mediaType === 'image' ? 'default' : 'outline'} onClick={() => setMediaType('image')} className="flex-1" size="sm">Image</Button>
                    <Button type="button" variant={mediaType === 'video' ? 'default' : 'outline'} onClick={() => setMediaType('video')} className="flex-1" size="sm">Video</Button>
                    <Button type="button" variant={mediaType === 'audio' ? 'default' : 'outline'} onClick={() => setMediaType('audio')} className="flex-1" size="sm">Audio</Button>
                  </div>
                  <Label htmlFor="cover-file" className="cursor-pointer mt-2 block">
                    <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 hover:border-neutral-400 transition-colors text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
                      <p className="text-sm text-neutral-600">
                        {coverFile ? coverFile.name : `Upload ${mediaType}`}
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="cover-file"
                    type="file"
                    accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : 'audio/*'}
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>

                <Button
                  onClick={handleAddYear}
                  disabled={isLoading}
                  className="w-full rounded-xl"
                >
                  {isLoading ? "Creating..." : "Create Timeline"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {years.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No timelines added yet. Create your first timeline!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {years.map((year) => (
              <div
                key={year.id}
                className="group relative rounded-xl overflow-hidden bg-neutral-100 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => onYearSelect(year.id)}
              >
                {year.background_type === 'image' && year.background_value ? (
                  <img
                    src={year.background_value}
                    alt={year.name}
                    className="w-full h-48 object-cover"
                  />
                ) : year.background_type === 'video' && year.background_value ? (
                  <video
                    src={year.background_value}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                    <span className="text-4xl font-bold text-neutral-400">{year.name}</span>
                  </div>
                )}

                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-800">{year.name}</h3>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteYear(year.id, year.background_value);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
