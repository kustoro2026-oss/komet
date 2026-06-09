import { create } from "zustand";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: "admin" | "editor" | "viewer";
  ownerId?: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (id: string) => void;
  clearWorkspaces: () => void;

  // Async API actions
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  updateWorkspace: (id: string, data: { name?: string }) => Promise<boolean>;
  deleteWorkspace: (id: string) => Promise<boolean>;
}

// LocalStorage fallback helpers
function loadLocal(): { workspaces: Workspace[]; activeWorkspace: Workspace | null } {
  if (typeof window === "undefined") return { workspaces: [], activeWorkspace: null };
  try {
    const raw = localStorage.getItem("komet-workspace");
    if (!raw) return { workspaces: [], activeWorkspace: null };
    const parsed = JSON.parse(raw);
    // Handle legacy persisted format from zustand persist
    const state = parsed.state || parsed;
    return {
      workspaces: state.workspaces || [],
      activeWorkspace: state.activeWorkspace || null,
    };
  } catch {
    return { workspaces: [], activeWorkspace: null };
  }
}

function saveLocal(workspaces: Workspace[], activeWorkspace: Workspace | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      "komet-workspace",
      JSON.stringify({ workspaces, activeWorkspace })
    );
  } catch {
    // localStorage full or unavailable
  }
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  // Initialize from localStorage
  ...loadLocal(),
  isLoading: false,
  error: null,

  setWorkspaces: (workspaces) => {
    set({ workspaces });
    saveLocal(workspaces, get().activeWorkspace);
  },

  setActiveWorkspace: (workspace) => {
    set({ activeWorkspace: workspace });
    saveLocal(get().workspaces, workspace);
  },

  addWorkspace: (workspace) => {
    const workspaces = [...get().workspaces, workspace];
    set({ workspaces });
    saveLocal(workspaces, get().activeWorkspace);
  },

  removeWorkspace: (id) => {
    const workspaces = get().workspaces.filter((w) => w.id !== id);
    const activeWorkspace =
      get().activeWorkspace?.id === id ? null : get().activeWorkspace;
    set({ workspaces, activeWorkspace });
    saveLocal(workspaces, activeWorkspace);
  },

  clearWorkspaces: () => {
    set({ workspaces: [], activeWorkspace: null });
    saveLocal([], null);
  },

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/workspace");
      if (!res.ok) {
        // API unavailable - fall back to localStorage
        set({ isLoading: false });
        seedIfEmpty();
        return;
      }
      const data = await res.json();
      if (data.workspaces && Array.isArray(data.workspaces)) {
        const apiWorkspaces: Workspace[] = data.workspaces;

        if (apiWorkspaces.length === 0) {
          // API returned empty list - keep localStorage data instead of overwriting with nothing
          set({ isLoading: false });
          seedIfEmpty();
          return;
        }

        // Preserve active workspace selection if it still exists in API
        const currentActive = get().activeWorkspace;
        const stillExists = currentActive
          ? apiWorkspaces.find((w) => w.id === currentActive.id)
          : null;

        set({
          workspaces: apiWorkspaces,
          activeWorkspace: stillExists || apiWorkspaces[0] || null,
          isLoading: false,
        });
        saveLocal(apiWorkspaces, stillExists || apiWorkspaces[0] || null);
      } else {
        set({ isLoading: false });
      }
    } catch {
      // Network error - fall back to localStorage
      set({ isLoading: false, error: null });
      seedIfEmpty();
    }

    function seedIfEmpty() {
      const current = get().workspaces;
      if (current.length === 0) {
        const defaultWs = { id: "default", name: "My Workspace", slug: "my-workspace", role: "admin" as const };
        set({ workspaces: [defaultWs], activeWorkspace: defaultWs });
        saveLocal([defaultWs], defaultWs);
      }
    }
  },

  createWorkspace: async (name) => {
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create" }));
        set({ error: err.error || "Failed to create workspace" });
        return null;
      }

      const data = await res.json();
      const workspace: Workspace = data.workspace;

      // Add to store and set as active
      const workspaces = [...get().workspaces, workspace];
      set({ workspaces, activeWorkspace: workspace, error: null });
      saveLocal(workspaces, workspace);

      return workspace;
    } catch {
      set({ error: "Network error while creating workspace" });
      return null;
    }
  },

  updateWorkspace: async (id, data) => {
    try {
      const res = await fetch(`/api/workspace/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) return false;

      const result = await res.json();
      const updated = result.workspace;

      // Update in local store
      const workspaces = get().workspaces.map((w) =>
        w.id === id ? { ...w, ...updated } : w
      );
      const activeWorkspace =
        get().activeWorkspace?.id === id
          ? { ...get().activeWorkspace!, ...updated }
          : get().activeWorkspace;

      set({ workspaces, activeWorkspace });
      saveLocal(workspaces, activeWorkspace);

      return true;
    } catch {
      return false;
    }
  },

  deleteWorkspace: async (id) => {
    try {
      const res = await fetch(`/api/workspace/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) return false;

      // Remove from store
      const workspaces = get().workspaces.filter((w) => w.id !== id);
      const activeWorkspace =
        get().activeWorkspace?.id === id
          ? workspaces[0] || null
          : get().activeWorkspace;

      set({ workspaces, activeWorkspace });
      saveLocal(workspaces, activeWorkspace);

      return true;
    } catch {
      return false;
    }
  },
}));
