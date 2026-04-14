import { useNavigate } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { PublicYearStackContainer } from "@/components/PublicYearStackContainer";
import { useImmersiveMode } from "@/hooks/useImmersiveMode";
import { Onboarding } from "@/components/Onboarding";
import { useState } from "react";

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const { isImmersiveMode } = useImmersiveMode();

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#000' }}>
      <Onboarding
        forcePlay={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      <PublicYearStackContainer />

      {/* Top Right Icons */}
      <div className={`absolute top-4 right-4 z-50 flex items-center gap-2 transition-opacity duration-700 ${
        isImmersiveMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <button
          onClick={() => setShowOnboarding(true)}
          className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
          title="How Kiko Works"
        >
          <HelpCircle className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={() => navigate('/explore')}
          className="w-10 h-10 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
          title="Explore Galleries"
        >
          <svg
            className="w-4 h-4 text-white/80 group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Index;
