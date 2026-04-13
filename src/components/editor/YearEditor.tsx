import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface YearEditorProps {
  userId: string;
  yearId?: string;
  onMonthSelect: (monthId: string) => void;
}

export const YearEditor = ({ userId, yearId, onMonthSelect }: YearEditorProps) => {
  const [year, setYear] = useState<any>(null);
  const [months, setMonths] = useState<any[]>([]);
  const [isAddMonthOpen, setIsAddMonthOpen] = useState(false);
  const [isEditYearOpen, setIsEditYearOpen] = useState(false);
  const [monthName, setMonthName] = useState("");
  const [yearName, setYearName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (yearId) {
      fetchYear();
      fetchMonths();
    }
  }, [yearId]);

  const fetchYear = async () => {
    if (!yearId) return;
    const { data, error } = await supabase
      .from('years')
      .select('*')
      .eq('id', yearId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch year.",
        variant: "destructive",
      });
    } else {
      setYear(data);
      setYearName(data.name);
    }
  };

  const fetchMonths = async () => {
    if (!yearId) return;
    const { data, error } = await supabase
      .from('months')
      .select('*')
      .eq('year_id', yearId)
      .order('display_order', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch months.",
        variant: "destructive",
      });
    } else {
      setMonths(data || []);
    }
  };

  const handleAddMonth = async () => {
    if (!monthName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a month name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let backgroundValue = null;
      let backgroundType = 'color';

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${userId}/months/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
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
        .from('months')
        .insert({
          year_id: yearId,
          user_id: userId,
          name: monthName.trim(),
          background_type: backgroundType,
          background_value: backgroundValue,
          display_order: months.length
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Card added successfully.",
      });

      setIsAddMonthOpen(false);
      setMonthName("");
      setCoverFile(null);
      fetchMonths();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add month.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateYear = async () => {
    if (!yearName.trim() || !yearId) {
      toast({
        title: "Error",
        description: "Please enter a year name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let backgroundValue = year?.background_value;
      let backgroundType = year?.background_type || 'color';

      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${userId}/years/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
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
        .update({
          name: yearName.trim(),
          background_type: backgroundType,
          background_value: backgroundValue,
        })
        .eq('id', yearId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timeline updated successfully.",
      });

      setIsEditYearOpen(false);
      setCoverFile(null);
      fetchYear();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update year.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMonth = async (id: string, backgroundValue: string | null) => {
    if (!window.confirm("Are you sure you want to delete this card? This will also delete all its media.")) {
      return;
    }

    try {
      if (backgroundValue) {
        const fileName = backgroundValue.split('/').slice(-3).join('/');
        await supabase.storage
          .from('vision-swipe-media')
          .remove([fileName]);
      }

      const { error } = await supabase
        .from('months')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Card deleted successfully.",
      });

      fetchMonths();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete month.",
        variant: "destructive",
      });
    }
  };

  if (!yearId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">No Timeline Selected</h2>
          <p className="text-neutral-600">Select a timeline from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  if (!year) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Details Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-neutral-800">{year.name}</h2>
          <Dialog open={isEditYearOpen} onOpenChange={setIsEditYearOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl">
                Edit Timeline
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Timeline</DialogTitle>
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
                  <Label>Background Media (Optional)</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={mediaType === 'image' ? 'default' : 'outline'}
                      onClick={() => setMediaType('image')}
                      className="flex-1"
                      size="sm"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Image
                    </Button>
                    <Button
                      type="button"
                      variant={mediaType === 'video' ? 'default' : 'outline'}
                      onClick={() => setMediaType('video')}
                      className="flex-1"
                      size="sm"
                    >
                      <VideoIcon className="w-4 h-4 mr-2" />
                      Video
                    </Button>
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
                    accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>

                <Button
                  onClick={handleUpdateYear}
                  disabled={isLoading}
                  className="w-full rounded-xl"
                >
                  {isLoading ? "Updating..." : "Update Timeline"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Background Preview */}
        {year.background_type === 'image' && year.background_value && (
          <div className="rounded-xl overflow-hidden mb-4">
            <img
              src={year.background_value}
              alt={year.name}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        {year.background_type === 'video' && year.background_value && (
          <div className="rounded-xl overflow-hidden mb-4">
            <video
              src={year.background_value}
              className="w-full h-48 object-cover"
              controls
            />
          </div>
        )}
      </div>

      {/* Months Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-neutral-800">Cards in {year.name}</h3>
          <Dialog open={isAddMonthOpen} onOpenChange={setIsAddMonthOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create a card
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="month-name">Card Name</Label>
                  <Input
                    id="month-name"
                    placeholder="e.g., January"
                    value={monthName}
                    onChange={(e) => setMonthName(e.target.value)}
                    className="rounded-xl mt-2"
                  />
                </div>

                <div>
                  <Label>Cover Media (Optional)</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={mediaType === 'image' ? 'default' : 'outline'}
                      onClick={() => setMediaType('image')}
                      className="flex-1"
                      size="sm"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Image
                    </Button>
                    <Button
                      type="button"
                      variant={mediaType === 'video' ? 'default' : 'outline'}
                      onClick={() => setMediaType('video')}
                      className="flex-1"
                      size="sm"
                    >
                      <VideoIcon className="w-4 h-4 mr-2" />
                      Video
                    </Button>
                  </div>
                  <Label htmlFor="month-cover-file" className="cursor-pointer mt-2 block">
                    <div className="border-2 border-dashed border-neutral-300 rounded-xl p-6 hover:border-neutral-400 transition-colors text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
                      <p className="text-sm text-neutral-600">
                        {coverFile ? coverFile.name : `Upload ${mediaType}`}
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="month-cover-file"
                    type="file"
                    accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>

                <Button
                  onClick={handleAddMonth}
                  disabled={isLoading}
                  className="w-full rounded-xl"
                >
                  {isLoading ? "Adding..." : "Add Card"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {months.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No cards yet. Create your first card!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map((month) => (
              <div
                key={month.id}
                className="group relative rounded-xl overflow-hidden bg-neutral-100 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => onMonthSelect(month.id)}
              >
                {month.background_type === 'image' && month.background_value ? (
                  <img
                    src={month.background_value}
                    alt={month.name}
                    className="w-full h-32 object-cover"
                  />
                ) : month.background_type === 'video' && month.background_value ? (
                  <video
                    src={month.background_value}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center">
                    <span className="text-xl font-bold text-neutral-400">{month.name}</span>
                  </div>
                )}

                <div className="p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-neutral-800">{month.name}</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMonth(month.id, month.background_value);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
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