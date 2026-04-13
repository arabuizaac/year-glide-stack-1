import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GlobalBackgroundProvider } from "@/contexts/GlobalBackgroundContext";
import { GlobalBackground } from "@/components/GlobalBackground";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Editor from "./pages/Editor";
import Month from "./pages/Month";
import Explore from "./pages/Explore";
import PublicGallery from "./pages/PublicGallery";
import Tutorial from "./pages/Tutorial";
import NotFound from "./pages/NotFound";
import Bookmarks from "./pages/Bookmarks";
import PaymentCallback from "./pages/PaymentCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GlobalBackgroundProvider>
        <GlobalBackground />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/u/:username" element={<PublicGallery />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/year/:year" element={<Month />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />
            {/* Redirect old month routes to gallery */}
            <Route path="/year/:year/month/:month" element={<NotFound />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </GlobalBackgroundProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
