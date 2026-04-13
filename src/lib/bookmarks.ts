export interface BookmarkedStory {
  userId: string;
  displayName: string;
  username: string;
  yearId: string;
  yearName: string;
  imageUrl?: string;
  savedAt: number;
}

export interface BookmarkedMoment {
  monthId: string;
  monthName: string;
  yearId: string;
  yearName: string;
  imageUrl?: string;
  savedAt: number;
}

interface BookmarkData {
  stories: BookmarkedStory[];
  moments: BookmarkedMoment[];
}

const KEY = "kiko_bookmarks_v1";

function load(): BookmarkData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { stories: [], moments: [] };
}

function persist(data: BookmarkData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export const getBookmarks = (): BookmarkData => load();

export const saveStory = (story: Omit<BookmarkedStory, "savedAt">): boolean => {
  const data = load();
  if (data.stories.some(s => s.userId === story.userId)) return false;
  data.stories.unshift({ ...story, savedAt: Date.now() });
  persist(data);
  return true;
};

export const saveMoment = (moment: Omit<BookmarkedMoment, "savedAt">): boolean => {
  const data = load();
  if (data.moments.some(m => m.monthId === moment.monthId)) return false;
  data.moments.unshift({ ...moment, savedAt: Date.now() });
  persist(data);
  return true;
};

export const removeStory = (userId: string) => {
  const data = load();
  data.stories = data.stories.filter(s => s.userId !== userId);
  persist(data);
};

export const removeMoment = (monthId: string) => {
  const data = load();
  data.moments = data.moments.filter(m => m.monthId !== monthId);
  persist(data);
};

export const isStorySaved = (userId: string): boolean =>
  load().stories.some(s => s.userId === userId);

export const isMomentSaved = (monthId: string): boolean =>
  load().moments.some(m => m.monthId === monthId);
