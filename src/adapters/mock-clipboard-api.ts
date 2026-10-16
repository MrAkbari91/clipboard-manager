import { ClipboardBrainAPI, ClipboardItem, ClipboardQuery, Project } from "../shared/clipboard-contract";

/**
 * Development-only in-memory mock adapter for browser development and tests.
 * Never used in production when window.clipboardBrain is provided by Electron preload.
 */
export function createMockClipboardAPI(): ClipboardBrainAPI {
  let isPaused = false;
  let items: ClipboardItem[] = [
    {
      id: "mock-1",
      content: "const greeting = 'Welcome to Clipboard Brain!';\nconsole.log(greeting);",
      contentType: "code",
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      isPinned: true,
      title: "JavaScript sample",
      projectId: "proj-1",
    },
    {
      id: "mock-2",
      content: "https://github.com/MrAkbari91/clipboard-manager",
      contentType: "url",
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      isPinned: false,
      title: "GitHub Repository",
      projectId: null,
    },
    {
      id: "mock-3",
      content: "#6366f1",
      contentType: "color",
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      isPinned: false,
      title: "Indigo Accent Color",
      projectId: null,
    },
    {
      id: "mock-4",
      content: "Meeting notes: Discuss Electron preload security, IPC channel contracts, and modern UI tokens with Developer 1.",
      contentType: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      isPinned: true,
      title: "Sprint Planning",
      projectId: "proj-1",
    },
  ];

  let projects: Project[] = [
    {
      id: "proj-1",
      name: "Clipboard Brain",
      description: "Desktop clipboard history app",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "proj-2",
      name: "Web Assets",
      description: "Design palettes, links, and snippets",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
  ];

  const listeners: Array<(item: ClipboardItem) => void> = [];

  return {
    async getItems(query?: ClipboardQuery): Promise<ClipboardItem[]> {
      let filtered = [...items];

      if (query?.search && query.search.trim()) {
        const s = query.search.toLowerCase().trim();
        filtered = filtered.filter(
          (i) =>
            i.content.toLowerCase().includes(s) ||
            (i.title && i.title.toLowerCase().includes(s))
        );
      }

      if (query?.contentType && query.contentType !== "all") {
        filtered = filtered.filter((i) => i.contentType === query.contentType);
      }

      if (query?.pinnedOnly) {
        filtered = filtered.filter((i) => i.isPinned);
      }

      if (query?.projectId !== undefined) {
        filtered = filtered.filter((i) => i.projectId === query.projectId);
      }

      if (query?.sort === "oldest") {
        filtered.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        // default newest
        filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      return filtered;
    },

    async copyItem(id: string): Promise<{ success: boolean }> {
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error(`Item ${id} not found`);
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(item.content);
        } catch {
          // fallback
        }
      }
      return { success: true };
    },

    async pinItem(id: string, isPinned: boolean): Promise<ClipboardItem> {
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error(`Item ${id} not found`);
      items[idx] = { ...items[idx], isPinned, updatedAt: new Date().toISOString() };
      return items[idx];
    },

    async deleteItem(id: string): Promise<{ success: boolean }> {
      items = items.filter((i) => i.id !== id);
      return { success: true };
    },

    async clearHistory(): Promise<{ deletedCount: number }> {
      const count = items.filter((item) => !item.isPinned).length;
      items = items.filter((item) => item.isPinned);
      return { deletedCount: count };
    },

    async openStorageFolder(): Promise<{ success: boolean; path: string }> {
      throw new Error("Storage folders are available in the desktop application.");
    },

    async getCaptureStatus(): Promise<{ isPaused: boolean }> {
      return { isPaused };
    },

    async setCapturePaused(paused: boolean): Promise<{ isPaused: boolean }> {
      isPaused = paused;
      return { isPaused };
    },

    onItemAdded(callback: (item: ClipboardItem) => void): () => void {
      listeners.push(callback);
      return () => {
        const index = listeners.indexOf(callback);
        if (index !== -1) listeners.splice(index, 1);
      };
    },

    async getProjects(): Promise<Project[]> {
      return [...projects];
    },

    async createProject(input: { name: string; description?: string }): Promise<Project> {
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        createdAt: new Date().toISOString(),
      };
      projects.push(newProj);
      return newProj;
    },

    async assignProject(itemId: string, projectId: string | null): Promise<ClipboardItem> {
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx === -1) throw new Error(`Item ${itemId} not found`);
      items[idx] = { ...items[idx], projectId, updatedAt: new Date().toISOString() };
      return items[idx];
    },

    async cleanExpiredItems(): Promise<{ deletedCount: number }> {
      return { deletedCount: 0 };
    },

    async getCapturePermissions(): Promise<{ allowedTypes: any[] }> {
      try {
        const saved = localStorage.getItem("clipboard_brain_allowed_types");
        if (saved) return { allowedTypes: JSON.parse(saved) };
      } catch {}
      return {
        allowedTypes: ["text", "code", "url", "color", "image", "video", "json", "emoji"],
      };
    },

    async setCapturePermissions(types: any[]): Promise<{ allowedTypes: any[] }> {
      try {
        localStorage.setItem("clipboard_brain_allowed_types", JSON.stringify(types));
      } catch {}
      return { allowedTypes: [...types] };
    },
  };
}
