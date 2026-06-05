import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: "admin" | "editor" | "viewer";
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  clearWorkspaces: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      activeWorkspace: null,
      setWorkspaces: (workspaces) =>
        set({ workspaces }),
      setActiveWorkspace: (workspace) =>
        set({ activeWorkspace: workspace }),
      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
        })),
      clearWorkspaces: () =>
        set({ workspaces: [], activeWorkspace: null }),
    }),
    {
      name: "komet-workspace",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workspaces: state.workspaces,
        activeWorkspace: state.activeWorkspace,
      }),
    }
  )
);
