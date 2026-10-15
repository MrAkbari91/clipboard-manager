export type ClipboardContentType =
  | "text"
  | "code"
  | "url"
  | "color"
  | "image"
  | "video"
  | "json"
  | "emoji";

export interface ClipboardItem {
  id: string;
  content: string;
  contentType: ClipboardContentType;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  title: string | null;
  projectId: string | null;
}

export interface ClipboardQuery {
  search?: string;
  contentType?: ClipboardContentType | "all";
  pinnedOnly?: boolean;
  projectId?: string | null;
  sort?: "newest" | "oldest";
}

export interface ClipboardBrainAPI {
  getItems(query?: ClipboardQuery): Promise<ClipboardItem[]>;
  copyItem(id: string): Promise<{ success: boolean }>;
  pinItem(id: string, isPinned: boolean): Promise<ClipboardItem>;
  deleteItem(id: string): Promise<{ success: boolean }>;
  clearHistory(): Promise<{ deletedCount: number }>;
  getCaptureStatus(): Promise<{ isPaused: boolean }>;
  setCapturePaused(isPaused: boolean): Promise<{ isPaused: boolean }>;
  onItemAdded(callback: (item: ClipboardItem) => void): () => void;
  getProjects(): Promise<Project[]>;
  createProject(input: { name: string; description?: string }): Promise<Project>;
  assignProject(itemId: string, projectId: string | null): Promise<ClipboardItem>;
  openStorageFolder(category?: string): Promise<{ success: boolean; path: string }>;
  cleanExpiredItems(days?: number): Promise<{ deletedCount: number }>;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

declare global {
  interface Window {
    clipboardBrain: ClipboardBrainAPI;
  }
}
