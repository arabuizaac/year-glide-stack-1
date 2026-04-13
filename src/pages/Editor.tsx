import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Home, Menu } from "lucide-react";
import { BackgroundSection } from "@/components/editor/BackgroundSection";
import { YearEditor } from "@/components/editor/YearEditor";
import { MonthGalleryEditor } from "@/components/editor/MonthGalleryEditor";
import { EditorSidebar } from "@/components/editor/EditorSidebar";
import { EditorPreview } from "@/components/editor/EditorPreview";
import { EditorControlBar } from "@/components/editor/EditorControlBar";
import { StorageSection } from "@/components/editor/StorageSection";
import { MessagesSection } from "@/components/editor/MessagesSection";
import { ProfileSection } from "@/components/editor/ProfileSection";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAutoSave } from "@/hooks/useAutoSave";

const Editor = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'year' | 'month' | 'background' | 'storage' | 'messages' | 'profile' | null;
    yearId?: string;
    monthId?: string;
  }>({ type: null });
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isSaving, formatLastSaved } = useAutoSave();

  // Navigate to storage section when returning from payment
  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'storage') {
      setSelectedItem({ type: 'storage' });
      setSearchParams({});
    }
  }, [searchParams]);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const handleViewVisionSwipe = () => {
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
        <div className="text-xl text-neutral-600">Loading...</div>
      </div>
    );
  }

  const renderMainContent = () => {
    if (!selectedItem.type) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-800 mb-2">Welcome to Kiko Editor</h2>
            <p className="text-neutral-600">Select an item from the sidebar to start editing</p>
          </div>
        </div>
      );
    }

    if (selectedItem.type === 'profile') {
      return <ProfileSection userId={user?.id} />;
    }

    if (selectedItem.type === 'background') {
      return <BackgroundSection userId={user?.id} />;
    }


    if (selectedItem.type === 'storage') {
      return <StorageSection userId={user?.id} />;
    }

    if (selectedItem.type === 'messages') {
      return <MessagesSection userId={user?.id} />;
    }

    if (selectedItem.type === 'year') {
      return (
        <YearEditor
          userId={user?.id}
          yearId={selectedItem.yearId}
          onMonthSelect={(monthId) =>
            setSelectedItem({ type: 'month', yearId: selectedItem.yearId, monthId })
          }
        />
      );
    }

    if (selectedItem.type === 'month' && selectedItem.monthId) {
      return (
        <MonthGalleryEditor
          userId={user?.id}
          monthId={selectedItem.monthId}
        />
      );
    }


    return null;
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">
                  <EditorSidebar
                    userId={user?.id}
                    selectedItem={selectedItem}
                    onSelectItem={(item) => {
                      setSelectedItem(item);
                      setIsSidebarOpen(false);
                    }}
                  />
                </SheetContent>
              </Sheet>
            )}
            <h1 className="text-xl font-bold text-neutral-800">Kiko Editor</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItem({ type: 'background' })}
              className="rounded-xl hidden sm:flex"
            >
              Background
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItem({ type: 'storage' })}
              className="rounded-xl hidden sm:flex"
            >
              Storage
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItem({ type: 'messages' })}
              className="rounded-xl hidden sm:flex"
            >
              Messages
            </Button>
            <Button variant="outline" onClick={handleViewVisionSwipe} size="sm" className="rounded-xl">
              <Home className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">View</span>
            </Button>
            <Button variant="outline" onClick={handleSignOut} size="sm" className="rounded-xl">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Desktop Only */}
        {!isMobile && (
          <div className="w-64 flex-shrink-0">
            <EditorSidebar
              userId={user?.id}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 max-w-5xl">
            {renderMainContent()}
          </div>
        </div>

        {/* Right Preview Panel - Desktop Only */}
        {!isMobile && (
        <div className="w-96 flex-shrink-0">
            <EditorPreview
              isVisible={isPreviewVisible}
              onToggleVisibility={() => setIsPreviewVisible(!isPreviewVisible)}
              userId={user?.id}
            />
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <EditorControlBar 
        isLiveMode={isLiveMode} 
        onToggleLiveMode={setIsLiveMode}
        lastAutoSaved={formatLastSaved()}
        isSaving={isSaving}
        userId={user?.id}
      />
    </div>
  );
};

export default Editor;
