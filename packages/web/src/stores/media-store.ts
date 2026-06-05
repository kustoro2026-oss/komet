import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface MediaItem {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document";
  size: string;
  dimensions?: string;
  thumbnail: string;
  createdAt: string;
  usedIn: number;
}

interface MediaState {
  items: MediaItem[];
  deleteItems: (ids: string[]) => void;
  addItems: (items: MediaItem[]) => void;
}

const SEED_MEDIA: MediaItem[] = [
  { id: "1", name: "hero-banner.png", type: "image", size: "2.4 MB", dimensions: "1920x1080", thumbnail: "", createdAt: "2024-06-01", usedIn: 3 },
  { id: "2", name: "product-launch.mp4", type: "video", size: "45 MB", dimensions: "1920x1080", thumbnail: "", createdAt: "2024-05-28", usedIn: 1 },
  { id: "3", name: "logo-white.svg", type: "image", size: "24 KB", thumbnail: "", createdAt: "2024-05-25", usedIn: 12 },
  { id: "4", name: "podcast-episode-42.mp3", type: "audio", size: "32 MB", thumbnail: "", createdAt: "2024-05-20", usedIn: 2 },
  { id: "5", name: "brand-guidelines.pdf", type: "document", size: "1.8 MB", thumbnail: "", createdAt: "2024-05-15", usedIn: 5 },
  { id: "6", name: "social-template-instagram.png", type: "image", size: "856 KB", dimensions: "1080x1080", thumbnail: "", createdAt: "2024-05-10", usedIn: 8 },
  { id: "7", name: "team-photo.jpg", type: "image", size: "3.2 MB", dimensions: "3000x2000", thumbnail: "", createdAt: "2024-05-08", usedIn: 4 },
  { id: "8", name: "tutorial-thumbnail.png", type: "image", size: "1.1 MB", dimensions: "1280x720", thumbnail: "", createdAt: "2024-05-05", usedIn: 6 },
  { id: "9", name: "bts-clip.mp4", type: "video", size: "28 MB", dimensions: "1080x1920", thumbnail: "", createdAt: "2024-05-01", usedIn: 1 },
  { id: "10", name: "press-kit.zip", type: "document", size: "15 MB", thumbnail: "", createdAt: "2024-04-28", usedIn: 0 },
  { id: "11", name: "icon-set.svg", type: "image", size: "156 KB", thumbnail: "", createdAt: "2024-04-25", usedIn: 9 },
  { id: "12", name: "background-texture.png", type: "image", size: "4.5 MB", dimensions: "4000x4000", thumbnail: "", createdAt: "2024-04-20", usedIn: 3 },
];

export const useMediaStore = create<MediaState>()(
  persist(
    (set) => ({
      items: SEED_MEDIA,
      deleteItems: (ids) =>
        set((state) => ({
          items: state.items.filter((item) => !ids.includes(item.id)),
        })),
      addItems: (newItems) =>
        set((state) => ({
          items: [...state.items, ...newItems],
        })),
    }),
    {
      name: "komet-media",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
