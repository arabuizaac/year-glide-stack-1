import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Video as VideoIcon, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MonthGalleryEditorProps {
  userId: string;
  monthId: string;
}

export const MonthGalleryEditor = ({ userId, monthId }: MonthGalleryEditorProps) => {
  const [month, setMonth] = useState<any>(null);
  const [isEditMonthOpen, setIsEditMonthOpen] = useState(false);
  const [monthName, setMonthName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMonth();
  }, [monthId]);

  const fetchMonth = async () => {
    const { data, error } = await supabase
      .from('months')
      .select('*')
      .eq('id', monthId)
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to fetch card.", variant: "destructive" });
    } else {
      setMonth(data);
      setMonthName(data.name);
    }
  };

  const handleUpdateMonth = async () => {
    if (!monthName.trim()) {
      toast({ title: "Error", description: "Please enter a card name.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      let backgroundValue = month?.background_value;
      let backgroundType = month?.background_type || 'color';

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
        .update({
          name: monthName.trim(),
          background_type: backgroundType,
          background_value: backgroundValue,
        })
        .eq('id', monthId);

      if (error) throw error;

      toast({ title: "💾 Card Updated", description: "Card details saved successfully." });
      setIsEditMonthOpen(false);
      setCoverFile(null);
      fetchMonth();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update card.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;
    try {
      const { error } = await supabase.from('months').delete().eq('id', monthId);
      if (error) throw error;
      toast({ title: "🗑️ Card Deleted", description: "Card has been deleted." });
    } catch {
      toast({ title: "Error", description: "Failed to delete card.", variant: "destructive" });
    }
  };

  if (!month) {
    return <div className="flex items-center justify-center h-full"><div className="text-xl text-muted-foreground">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Card Details */}
      <div className="bg-background rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">{month.name}</h2>
          <div className="flex items-center gap-2">
            <Dialog open={isEditMonthOpen} onOpenChange={setIsEditMonthOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">Edit Card</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="month-name">Card Name</Label>
                    <Input id="month-name" placeholder="e.g., Chapter 1" value={monthName} onChange={(e) => setMonthName(e.target.value)} className="rounded-xl mt-2" />
                  </div>
                  <div>
                    <Label>Cover Media (Optional)</Label>
                    <div className="flex gap-2 mt-2">
                      <Button type="button" variant={mediaType === 'image' ? 'default' : 'outline'} onClick={() => setMediaType('image')} className="flex-1" size="sm">
                        <ImageIcon className="w-4 h-4 mr-2" /> Image
                      </Button>
                      <Button type="button" variant={mediaType === 'video' ? 'default' : 'outline'} onClick={() => setMediaType('video')} className="flex-1" size="sm">
                        <VideoIcon className="w-4 h-4 mr-2" /> Video
                      </Button>
                    </div>
                    <Label htmlFor="cover-file" className="cursor-pointer mt-2 block">
                      <div className="border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 transition-colors text-center">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{coverFile ? coverFile.name : `Upload ${mediaType}`}</p>
                      </div>
                    </Label>
                    <Input id="cover-file" type="file" accept={mediaType === 'image' ? 'image/*' : 'video/*'} onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="hidden" />
                  </div>
                  <Button onClick={handleUpdateMonth} disabled={isLoading} className="w-full rounded-xl">
                    {isLoading ? "Updating..." : "Update Card"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" size="sm" className="rounded-xl" onClick={handleDeleteCard}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </div>

        {month.background_type === 'image' && month.background_value && (
          <div className="rounded-xl overflow-hidden"><img src={month.background_value} alt={month.name} className="w-full h-40 object-cover" /></div>
        )}
        {month.background_type === 'video' && month.background_value && (
          <div className="rounded-xl overflow-hidden"><video src={month.background_value} className="w-full h-40 object-cover" controls /></div>
        )}

        <p className="text-sm text-muted-foreground mt-4">
          This is a terminal card. You can edit its name and cover media above. No further nesting is allowed.
        </p>
      </div>
    </div>
  );
};
