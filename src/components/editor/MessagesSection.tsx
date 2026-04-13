import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Mail, MailOpen } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read: boolean;
  recipient_user_id: string | null;
}

interface MessagesSectionProps {
  userId?: string;
}

export const MessagesSection = ({ userId }: MessagesSectionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = async (uid: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("recipient_user_id", uid)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error loading messages",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Don't fetch if userId is empty or undefined
    if (!userId) {
      setIsLoading(false);
      setMessages([]);
      return;
    }
    
    fetchMessages(userId);
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`contact_messages_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_messages",
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => {
          fetchMessages(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  const toggleReadStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ read: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, read: !currentStatus } : msg
        )
      );

      toast({
        title: `Message marked as ${!currentStatus ? "read" : "unread"}`,
      });
    } catch (error) {
      console.error("Error updating message:", error);
      toast({
        title: "Error updating message",
        variant: "destructive",
      });
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMessages.map((m) => m.id)));
    }
  };

  const deleteSelectedMessages = async () => {
    if (selectedIds.size === 0) return;

    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      setMessages((prev) => prev.filter((msg) => !selectedIds.has(msg.id)));
      setSelectedIds(new Set());
      toast({
        title: `${selectedIds.size} message${selectedIds.size > 1 ? "s" : ""} deleted`,
      });
    } catch (error) {
      console.error("Error deleting messages:", error);
      toast({
        title: "Error deleting messages",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "unread") return !msg.read;
    if (filter === "read") return msg.read;
    return true;
  });

  const unreadCount = messages.filter((msg) => !msg.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
        <p className="text-muted-foreground">
          View and manage messages from your VisionSwipe page visitors
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="all">
              All {messages.length > 0 && `(${messages.length})`}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="read">
              Read {messages.length - unreadCount > 0 && `(${messages.length - unreadCount})`}
            </TabsTrigger>
          </TabsList>

          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedIds.size})
            </Button>
          )}
        </div>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading messages...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No messages {filter !== "all" && `marked as ${filter}`} yet.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center gap-2 px-1">
                <Checkbox
                  id="select-all"
                  checked={selectedIds.size === filteredMessages.length && filteredMessages.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">
                  Select all
                </label>
              </div>

              {filteredMessages.map((msg) => (
                <Card key={msg.id} className={!msg.read ? "border-primary/50 bg-accent/5" : ""}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.has(msg.id)}
                        onCheckedChange={() => toggleSelection(msg.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{msg.name}</CardTitle>
                              {!msg.read && (
                                <Badge variant="default" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            {msg.email && (
                              <CardDescription>{msg.email}</CardDescription>
                            )}
                            <CardDescription className="text-xs">
                              {format(new Date(msg.created_at), "PPp")}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleReadStatus(msg.id, msg.read)}
                              title={msg.read ? "Mark as unread" : "Mark as read"}
                            >
                              {msg.read ? (
                                <Mail className="h-4 w-4" />
                              ) : (
                                <MailOpen className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-12">
                    <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} message{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected message{selectedIds.size > 1 ? "s" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelectedMessages}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
