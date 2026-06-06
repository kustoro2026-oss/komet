import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface MediaItem {
  id: string;
  name: string;
  type: "image" | "video" | "audio" | "document";
  mimeType?: string;
  size: string;
  sizeBytes?: number;
  dimensions?: string;
  publicUrl: string;
  key?: string;
  createdAt: string;
  usedIn: number;
}

interface MediaState {
  items: MediaItem[];
  deleteItems: (ids: string[]) => void;
  addItem: (item: MediaItem) => void;
  addItems: (items: MediaItem[]) => void;
  incrementUsedIn: (id: string) => void;
  isUploading: boolean;
  uploadProgress: number;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
}

export const useMediaStore = create<MediaState>()(
  persist(
    (set) => ({
      items: [],
      isUploading: false,
      uploadProgress: 0,
      deleteItems: (ids) =>
        set((state) => ({
          items: state.items.filter((item) => !ids.includes(item.id)),
        })),
      addItem: (item) =>
        set((state) => ({
          items: [item, ...state.items],
        })),
      addItems: (newItems) =>
        set((state) => ({
          items: [...state.items, ...newItems],
        })),
      incrementUsedIn: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, usedIn: item.usedIn + 1 } : item
          ),
        })),
      setUploading: (uploading) =>
        set({ isUploading: uploading }),
      setUploadProgress: (progress) =>
        set({ uploadProgress: progress }),
    }),
    {
      name: "komet-media",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
