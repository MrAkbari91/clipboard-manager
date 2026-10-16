import { ipcMain, clipboard, BrowserWindow, shell, nativeImage } from "electron";
import { IPC_CHANNELS } from "./channels";
import { DatabaseService } from "../db/database";
import { ClipboardMonitor } from "../clipboard-monitor";
import { ClipboardQuery, ClipboardContentType } from "../../src/shared/clipboard-contract";

export interface RegisterIpcOptions {
  db: DatabaseService;
  monitor: ClipboardMonitor;
  getMainWindow: () => BrowserWindow | null;
}

export function registerIpcHandlers({ db, monitor, getMainWindow: _getMainWindow }: RegisterIpcOptions): void {
  // 1. Get Items
  ipcMain.handle(IPC_CHANNELS.GET_ITEMS, async (_event, query?: ClipboardQuery) => {
    try {
      if (query && typeof query !== "object") {
        throw new Error("Invalid query parameter");
      }
      return await db.getItems(query);
    } catch (err: any) {
      console.error("IPC GET_ITEMS error:", err.message);
      throw new Error(`Failed to retrieve clipboard items: ${err.message}`);
    }
  });

  // 2. Copy Item to System Clipboard in its native format (image or text)
  ipcMain.handle(IPC_CHANNELS.COPY_ITEM, async (_event, id: string) => {
    try {
      if (!id || typeof id !== "string") {
        throw new Error("A valid string ID is required");
      }
      const item = await db.getItemById(id);
      if (!item) {
        throw new Error(`Clipboard item with ID ${id} not found`);
      }

      if (item.contentType === "image") {
        const img = nativeImage.createFromDataURL(item.content);
        clipboard.writeImage(img);
      } else {
        clipboard.writeText(item.content);
      }
      return { success: true };
    } catch (err: any) {
      console.error("IPC COPY_ITEM error:", err.message);
      throw new Error(`Failed to copy item: ${err.message}`);
    }
  });

  // 3. Pin / Unpin Item
  ipcMain.handle(IPC_CHANNELS.PIN_ITEM, async (_event, id: string, isPinned: boolean) => {
    try {
      if (!id || typeof id !== "string") {
        throw new Error("A valid string ID is required");
      }
      if (typeof isPinned !== "boolean") {
        throw new Error("isPinned must be a boolean");
      }
      return await db.pinItem(id, isPinned);
    } catch (err: any) {
      console.error("IPC PIN_ITEM error:", err.message);
      throw new Error(`Failed to update pin status: ${err.message}`);
    }
  });

  // 4. Delete Item
  ipcMain.handle(IPC_CHANNELS.DELETE_ITEM, async (_event, id: string) => {
    try {
      if (!id || typeof id !== "string") {
        throw new Error("A valid string ID is required");
      }
      return await db.deleteItem(id);
    } catch (err: any) {
      console.error("IPC DELETE_ITEM error:", err.message);
      throw new Error(`Failed to delete item: ${err.message}`);
    }
  });

  // 5. Clear History
  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, async () => {
    try {
      return await db.clearHistory();
    } catch (err: any) {
      console.error("IPC CLEAR_HISTORY error:", err.message);
      throw new Error(`Failed to clear history: ${err.message}`);
    }
  });

  // 6. Get Capture Status
  ipcMain.handle(IPC_CHANNELS.GET_CAPTURE_STATUS, async () => {
    try {
      return { isPaused: monitor.isPaused() };
    } catch (err: any) {
      console.error("IPC GET_CAPTURE_STATUS error:", err.message);
      throw new Error(`Failed to get capture status: ${err.message}`);
    }
  });

  // 7. Set Capture Paused
  ipcMain.handle(IPC_CHANNELS.SET_CAPTURE_PAUSED, async (_event, isPaused: boolean) => {
    try {
      if (typeof isPaused !== "boolean") {
        throw new Error("isPaused must be a boolean");
      }
      const updated = monitor.setPaused(isPaused);
      return { isPaused: updated };
    } catch (err: any) {
      console.error("IPC SET_CAPTURE_PAUSED error:", err.message);
      throw new Error(`Failed to update capture paused state: ${err.message}`);
    }
  });

  // 8. Get Projects
  ipcMain.handle(IPC_CHANNELS.GET_PROJECTS, async () => {
    try {
      return await db.getProjects();
    } catch (err: any) {
      console.error("IPC GET_PROJECTS error:", err.message);
      throw new Error(`Failed to get projects: ${err.message}`);
    }
  });

  // 9. Create Project
  ipcMain.handle(
    IPC_CHANNELS.CREATE_PROJECT,
    async (_event, input: { name: string; description?: string }) => {
      try {
        if (!input || !input.name || typeof input.name !== "string" || !input.name.trim()) {
          throw new Error("Project name is required");
        }
        return await db.createProject({
          name: input.name.trim(),
          description: input.description?.trim(),
        });
      } catch (err: any) {
        console.error("IPC CREATE_PROJECT error:", err.message);
        throw new Error(`Failed to create project: ${err.message}`);
      }
    }
  );

  // 10. Assign Project
  ipcMain.handle(
    IPC_CHANNELS.ASSIGN_PROJECT,
    async (_event, itemId: string, projectId: string | null) => {
      try {
        if (!itemId || typeof itemId !== "string") {
          throw new Error("A valid string itemId is required");
        }
        if (projectId !== null && typeof projectId !== "string") {
          throw new Error("projectId must be a string or null");
        }
        return await db.assignProject(itemId, projectId);
      } catch (err: any) {
        console.error("IPC ASSIGN_PROJECT error:", err.message);
        throw new Error(`Failed to assign project: ${err.message}`);
      }
    }
  );

  // 11. Open Storage Folder in Windows Explorer
  ipcMain.handle(IPC_CHANNELS.OPEN_STORAGE_FOLDER, async (_event, category?: string) => {
    try {
      const folderPath = db.getStorageDirectory(category);
      await shell.openPath(folderPath);
      return { success: true, path: folderPath };
    } catch (err: any) {
      console.error("IPC OPEN_STORAGE_FOLDER error:", err.message);
      throw new Error(`Failed to open storage folder: ${err.message}`);
    }
  });

  // 12. Clean Expired Items (Auto-cleanup / 1-week expiry)
  ipcMain.handle(IPC_CHANNELS.CLEAN_EXPIRED, async (_event, days?: number) => {
    try {
      const retentionDays = typeof days === "number" && days > 0 ? days : 7;
      return await db.cleanupExpiredItems(retentionDays);
    } catch (err: any) {
      console.error("IPC CLEAN_EXPIRED error:", err.message);
      throw new Error(`Failed to clean expired items: ${err.message}`);
    }
  });

  // 13. Get Capture Permissions (Allowed content types)
  ipcMain.handle(IPC_CHANNELS.GET_CAPTURE_PERMISSIONS, async () => {
    try {
      return { allowedTypes: monitor.getAllowedTypes() };
    } catch (err: any) {
      console.error("IPC GET_CAPTURE_PERMISSIONS error:", err.message);
      throw new Error(`Failed to get capture permissions: ${err.message}`);
    }
  });

  // 14. Set Capture Permissions (Allowed content types)
  ipcMain.handle(
    IPC_CHANNELS.SET_CAPTURE_PERMISSIONS,
    async (_event, allowedTypes: ClipboardContentType[]) => {
      try {
        if (!Array.isArray(allowedTypes)) {
          throw new Error("allowedTypes must be an array of content types");
        }
        monitor.setAllowedTypes(allowedTypes);
        db.saveSettings({ allowedContentTypes: allowedTypes });
        return { allowedTypes: monitor.getAllowedTypes() };
      } catch (err: any) {
        console.error("IPC SET_CAPTURE_PERMISSIONS error:", err.message);
        throw new Error(`Failed to set capture permissions: ${err.message}`);
      }
    }
  );
}

export function unregisterIpcHandlers(): void {
  for (const channel of Object.values(IPC_CHANNELS)) {
    ipcMain.removeHandler(channel);
  }
}
