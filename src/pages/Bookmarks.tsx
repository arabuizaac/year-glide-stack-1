import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bookmark, BookmarkX, Film, Image } from "lucide-react";
import {
  getBookmarks,
  removeStory,
  removeMoment,
  BookmarkedStory,
  BookmarkedMoment,
} from "@/lib/bookmarks";
import { jumpToCreatorByUserId } from "@/hooks/useCreatorDiscovery";

type Tab = "stories" | "moments";

const Bookmarks = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("stories");
  const [, rerender] = useState(0);
  const refresh = useCallback(() => rerender(n => n + 1), []);

  const { stories, moments } = getBookmarks();

  const openStory = useCallback(
    (story: BookmarkedStory) => {
      jumpToCreatorByUserId(story.userId);
      navigate("/");
    },
    [navigate]
  );

  const openMoment = useCallback(
    (moment: BookmarkedMoment) => {
      navigate(`/year/${moment.yearId}?card=${moment.monthId}`);
    },
    [navigate]
  );

  const handleRemoveStory = useCallback(
    (e: React.MouseEvent, userId: string) => {
      e.stopPropagation();
      removeStory(userId);
      refresh();
    },
    [refresh]
  );

  const handleRemoveMoment = useCallback(
    (e: React.MouseEvent, monthId: string) => {
      e.stopPropagation();
      removeMoment(monthId);
      refresh();
    },
    [refresh]
  );

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 shrink-0">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm min-h-[48px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-white font-semibold text-lg flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Bookmarks
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex px-4 gap-2 mb-4 shrink-0">
          {(["stories", "moments"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white/20 text-white border border-white/30"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {tab === "stories" ? "Saved Stories" : "Saved Moments"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <AnimatePresence mode="wait">
            {activeTab === "stories" ? (
              <motion.div
                key="stories"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {stories.length === 0 ? (
                  <EmptyState
                    icon={<Film className="w-8 h-8 text-white/30" />}
                    message="No saved stories yet"
                    hint="Tap the bookmark icon on a timeline card and choose 'Save entire story'"
                  />
                ) : (
                  stories.map(story => (
                    <motion.div
                      key={story.userId}
                      onClick={() => openStory(story)}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all duration-200"
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-18 rounded-xl overflow-hidden shrink-0 bg-white/10" style={{ height: "3.5rem" }}>
                        {story.imageUrl ? (
                          <img
                            src={story.imageUrl}
                            alt={story.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-5 h-5 text-white/30" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{story.displayName}</p>
                        <p className="text-white/50 text-xs truncate">@{story.username}</p>
                        <p className="text-white/30 text-xs mt-0.5">{story.yearName}</p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={e => handleRemoveStory(e, story.userId)}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/20 flex items-center justify-center transition-colors shrink-0"
                        title="Remove bookmark"
                      >
                        <BookmarkX className="w-4 h-4 text-white/60" />
                      </button>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="moments"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {moments.length === 0 ? (
                  <EmptyState
                    icon={<Image className="w-8 h-8 text-white/30" />}
                    message="No saved moments yet"
                    hint="Tap the bookmark icon on a story card and choose 'Save this moment'"
                  />
                ) : (
                  moments.map(moment => (
                    <motion.div
                      key={moment.monthId}
                      onClick={() => openMoment(moment)}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 cursor-pointer hover:bg-white/15 active:scale-[0.98] transition-all duration-200"
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Thumbnail */}
                      <div className="w-14 rounded-xl overflow-hidden shrink-0 bg-white/10" style={{ height: "3.5rem" }}>
                        {moment.imageUrl ? (
                          <img
                            src={moment.imageUrl}
                            alt={moment.monthName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-5 h-5 text-white/30" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{moment.monthName}</p>
                        <p className="text-white/50 text-xs truncate">{moment.yearName}</p>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={e => handleRemoveMoment(e, moment.monthId)}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/20 flex items-center justify-center transition-colors shrink-0"
                        title="Remove bookmark"
                      >
                        <BookmarkX className="w-4 h-4 text-white/60" />
                      </button>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({
  icon,
  message,
  hint,
}: {
  icon: React.ReactNode;
  message: string;
  hint: string;
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="mb-4 opacity-60">{icon}</div>
    <p className="text-white/60 font-medium mb-2">{message}</p>
    <p className="text-white/30 text-sm max-w-xs">{hint}</p>
  </div>
);

export default Bookmarks;
