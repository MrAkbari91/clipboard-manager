import { app, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import { DatabaseService } from "./db/database";
import { ClipboardMonitor } from "./clipboard-monitor";
import { registerIpcHandlers, unregisterIpcHandlers } from "./ipc/handlers";
import { IPC_CHANNELS } from "./ipc/channels";

let mainWindow: BrowserWindow | null = null;
let db: DatabaseService | null = null;
let monitor: ClipboardMonitor | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    title: "Clipboard Brain",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_RENDERER_URL;

  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
  } else {
    let indexPath = path.join(__dirname, "../dist/index.html");
    if (!fs.existsSync(indexPath)) {
      indexPath = path.join(__dirname, "../../dist/index.html");
    }
    await mainWindow.loadFile(indexPath);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function bootstrap() {
  try {
    // 1. Initialize persistent database
    db = new DatabaseService();
    await db.initialize();

    // 2. Initialize clipboard monitor
    monitor = new ClipboardMonitor({
      pollIntervalMs: 700,
      onNewItem: async (itemData) => {
        if (!db) return null;
        try {
          const saved = await db.addItem(itemData);
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IPC_CHANNELS.ITEM_ADDED, saved);
          }
          return saved;
        } catch (err) {
          if (process.env.NODE_ENV !== "production") {
            console.error("Failed to save clipboard item:", err);
          }
          return null;
        }
      },
    });

    // 3. Register validated IPC handlers
    registerIpcHandlers({
      db,
      monitor,
      getMainWindow: () => mainWindow,
    });

    // 4. Create UI Window
    await createWindow();

    // 5. Start clipboard monitoring
    monitor.start();
  } catch (err) {
    console.error("Fatal startup error in Clipboard Brain main process:", err);
    app.quit();
  }
}

app.whenReady().then(bootstrap);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", async () => {
  if (monitor) {
    monitor.stop();
  }
  unregisterIpcHandlers();
  if (db) {
    await db.close();
  }
});
