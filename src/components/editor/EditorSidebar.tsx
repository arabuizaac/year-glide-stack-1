import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ChevronDown, ChevronRight, Plus, Trash2, GripVertical, Palette, UserCircle2, HardDrive, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Year {
  id: string;
  name: string;
  display_order: number;
}

interface Month {
  id: string;
  name: string;
  year_id: string;
  display_order: number;
}

interface EditorSidebarProps {
  userId: string;
  selectedItem: {
    type: 'year' | 'month' | 'background' | 'storage' | 'messages' | 'profile' | null;
    yearId?: string;
    monthId?: string;
  };
  onSelectItem: (item: {
    type: 'year' | 'month' | 'background' | 'storage' | 'messages' | 'profile';
    yearId?: string;
    monthId?: string;
  }) => void;
}

export const EditorSidebar = ({ userId, selectedItem, onSelectItem }: EditorSidebarProps) => {
  const [years, setYears] = useState<Year[]>([]);
  const [months, setMonths] = useState<{ [yearId: string]: Month[] }>({});
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [newYearName, setNewYearName] = useState("");
  const [isAddingYear, setIsAddingYear] = useState(false);
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const fetchMonthsForYear = async (yearId: string) => {
    if (months[yearId]) return;

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
      setMonths(prev => ({ ...prev, [yearId]: data || [] }));
    }
  };

  const toggleYear = (yearId: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(yearId)) {
      newExpanded.delete(yearId);
    } else {
      newExpanded.add(yearId);
      fetchMonthsForYear(yearId);
    }
    setExpandedYears(newExpanded);
  };


  const handleAddYear = async () => {
    if (!newYearName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a year name.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingYear(true);

    try {
      const { data, error } = await supabase
        .from('years')
        .insert({
          user_id: userId,
          name: newYearName.trim(),
          display_order: years.length,
        })
        .select()
        .single();

      if (error) throw error;

    toast({
        title: "✅ Timeline created!",
        description: `${newYearName} has been created.`,
      });

      setNewYearName("");
      setIsAddYearOpen(false);
      await fetchYears();
      
      if (data) {
        onSelectItem({ type: 'year', yearId: data.id });
      }
    } catch (error: any) {
      toast({
        title: "⚠️ Failed to add year",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingYear(false);
    }
  };

  const handleDeleteYear = async (yearId: string) => {
    if (!window.confirm("Are you sure you want to delete this timeline and all its cards?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('years')
        .delete()
        .eq('id', yearId);

      if (error) throw error;

      toast({
        title: "🗑️ Timeline Deleted",
        description: "Timeline and its cards have been deleted.",
      });

      fetchYears();
    } catch (error: any) {
      toast({
        title: "⚠️ Error",
        description: "Failed to delete year.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMonth = async (monthId: string) => {
    if (!window.confirm("Are you sure you want to delete this card?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('months')
        .delete()
        .eq('id', monthId);

      if (error) throw error;

      toast({
        title: "🗑️ Card Deleted",
        description: "Card has been deleted.",
      });

      // Refresh months for all years
      const yearIds = Object.keys(months);
      for (const yearId of yearIds) {
        setMonths(prev => {
          const updated = { ...prev };
          delete updated[yearId];
          return updated;
        });
        await fetchMonthsForYear(yearId);
      }
    } catch (error: any) {
      toast({
        title: "⚠️ Error",
        description: "Failed to delete month.",
        variant: "destructive",
      });
    }
  };

  const handleDragEndYears = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = years.findIndex((year) => year.id === active.id);
      const newIndex = years.findIndex((year) => year.id === over.id);

      const newYears = arrayMove(years, oldIndex, newIndex);
      setYears(newYears);

      try {
        const updates = newYears.map((year, index) => ({
          id: year.id,
          display_order: index,
        }));

        for (const update of updates) {
          await supabase
            .from('years')
            .update({ display_order: update.display_order })
            .eq('id', update.id);
        }

        toast({
          title: "💾 Saved",
          description: "Year order updated.",
        });
      } catch (error) {
        toast({
          title: "⚠️ Error",
          description: "Failed to update year order.",
          variant: "destructive",
        });
        fetchYears();
      }
    }
  };

  const SortableYearItem = ({ year }: { year: Year }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: year.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} className="space-y-1">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors group ${
            selectedItem.yearId === year.id ? 'bg-neutral-100' : ''
          }`}
        >
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-neutral-400" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => toggleYear(year.id)}
          >
            {expandedYears.has(year.id) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          <span
            className="flex-1 text-sm font-medium"
            onClick={() => onSelectItem({ type: 'year', yearId: year.id })}
          >
            {year.name}
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteYear(year.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {expandedYears.has(year.id) && months[year.id] && (
          <div className="ml-6 space-y-1">
            {months[year.id].map((month) => (
              <div
                key={month.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors group ${
                  selectedItem.monthId === month.id ? 'bg-neutral-100' : ''
                }`}
              >
                <Calendar className="h-4 w-4 text-neutral-400" />

                <span
                  className="flex-1 text-sm"
                  onClick={() =>
                    onSelectItem({
                      type: 'month',
                      yearId: year.id,
                      monthId: month.id,
                    })
                  }
                >
                  {month.name}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMonth(month.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <ScrollArea className="h-full bg-white border-r border-neutral-200">
      <div className="p-4 space-y-2">
        <Button
          variant={selectedItem.type === 'profile' ? 'secondary' : 'ghost'}
          className="w-full justify-start rounded-xl"
          onClick={() => onSelectItem({ type: 'profile' })}
        >
          <UserCircle2 className="mr-2 h-4 w-4" />
          Public Profile
        </Button>

        <Button
          variant={selectedItem.type === 'background' ? 'secondary' : 'ghost'}
          className="w-full justify-start rounded-xl"
          onClick={() => onSelectItem({ type: 'background' })}
        >
          <Palette className="mr-2 h-4 w-4" />
          Background
        </Button>


        <Button
          variant={selectedItem.type === 'storage' ? 'secondary' : 'ghost'}
          className="w-full justify-start rounded-xl"
          onClick={() => onSelectItem({ type: 'storage' })}
        >
          <HardDrive className="mr-2 h-4 w-4" />
          Storage
        </Button>

        <Button
          variant={selectedItem.type === 'messages' ? 'secondary' : 'ghost'}
          className="w-full justify-start rounded-xl"
          onClick={() => onSelectItem({ type: 'messages' })}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Messages
        </Button>

        <div className="h-px bg-neutral-200 my-4" />

        <div className="space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndYears}
          >
            <SortableContext
              items={years.map(y => y.id)}
              strategy={verticalListSortingStrategy}
            >
              {years.map((year) => (
                <SortableYearItem key={year.id} year={year} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <Dialog open={isAddYearOpen} onOpenChange={setIsAddYearOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full rounded-xl">
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
                  placeholder="e.g., 2025"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAddingYear) {
                      handleAddYear();
                    }
                  }}
                  className="rounded-xl mt-2"
                  autoFocus
                />
              </div>

              <Button
                onClick={handleAddYear}
                disabled={isAddingYear}
                className="w-full rounded-xl"
              >
                {isAddingYear ? "Creating..." : "Create Timeline"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
};
