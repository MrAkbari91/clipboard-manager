import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { ClipboardBrainAPI, ClipboardItem, ClipboardQuery, Project } from "../src/shared/clipboard-contract";
import { IPC_CHANNELS } from "./ipc/channels";

const api: ClipboardBrainAPI = {
  getItems: (query?: ClipboardQuery): Promise<ClipboardItem[]> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_ITEMS, query);
  },
  copyItem: (id: string): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.COPY_ITEM, id);
  },
  pinItem: (id: string, isPinned: boolean): Promise<ClipboardItem> => {
    return ipcRenderer.invoke(IPC_CHANNELS.PIN_ITEM, id, isPinned);
  },
  deleteItem: (id: string): Promise<{ success: boolean }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.DELETE_ITEM, id);
  },
  clearHistory: (): Promise<{ deletedCount: number }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CLEAR_HISTORY);
  },
  getCaptureStatus: (): Promise<{ isPaused: boolean }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_CAPTURE_STATUS);
  },
  setCapturePaused: (isPaused: boolean): Promise<{ isPaused: boolean }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SET_CAPTURE_PAUSED, isPaused);
  },
  onItemAdded: (callback: (item: ClipboardItem) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, item: ClipboardItem) => {
      try {
        callback(item);
      } catch (err) {
        console.error("Error in onItemAdded listener:", err);
      }
    };
    ipcRenderer.on(IPC_CHANNELS.ITEM_ADDED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.ITEM_ADDED, handler);
    };
  },
  getProjects: (): Promise<Project[]> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_PROJECTS);
  },
  createProject: (input: { name: string; description?: string }): Promise<Project> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CREATE_PROJECT, input);
  },
  assignProject: (itemId: string, projectId: string | null): Promise<ClipboardItem> => {
    return ipcRenderer.invoke(IPC_CHANNELS.ASSIGN_PROJECT, itemId, projectId);
  },
  openStorageFolder: (category?: string): Promise<{ success: boolean; path: string }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_STORAGE_FOLDER, category);
  },
  cleanExpiredItems: (days?: number): Promise<{ deletedCount: number }> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CLEAN_EXPIRED, days);
  },
};

contextBridge.exposeInMainWorld("clipboardBrain", api);
