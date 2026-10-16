import { app, BrowserWindow, Tray, Menu, nativeImage } from "electron";
import path from "path";
import fs from "fs";
import { DatabaseService } from "./db/database";
import { ClipboardMonitor } from "./clipboard-monitor";
import { registerIpcHandlers, unregisterIpcHandlers } from "./ipc/handlers";
import { IPC_CHANNELS } from "./ipc/channels";

// Single instance lock to prevent duplicate background instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let db: DatabaseService | null = null;
let monitor: ClipboardMonitor | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let cleanupTimer: NodeJS.Timeout | null = null;

// 32x32 crisp clipboard tray icon PNG (tested & validated base64 fallback)
const TRAY_ICON_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAh0lEQVR4nGNgGIrg6zzu/9jwgFpON0fgsmhkOOBmORvOoIaJg9RQbJGcpnWFavLr/8gYZDApGF0/yEyiLEfXSC0HwPDQcgC1wKgDhocDrJu+kYSHXwiMOiClpJskPPxCYNQBpMb78AuBAXfAlMU7sOKREwIj0wG0wIPfAQw4+gWUYqL7BfQGALlcx2jf2b4OAAAAAElFTkSuQmCC";

function getAppIcon(): Electron.NativeImage {
  const possiblePaths = [
    path.join(app.getAppPath(), "assets", "tray-icon.ico"),
    path.join(__dirname, "assets", "tray-icon.ico"),
    path.join(__dirname, "..", "assets", "tray-icon.ico"),
    path.join(__dirname, "..", "..", "assets", "tray-icon.ico"),
    path.join(app.getAppPath(), "assets", "tray-icon.png"),
    path.join(__dirname, "assets", "tray-icon.png"),
    path.join(__dirname, "..", "assets", "tray-icon.png"),
    path.join(__dirname, "..", "..", "assets", "tray-icon.png"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) {
          return img;
        }
      } catch {
        // Fallback to data URL
      }
    }
  }

  return nativeImage.createFromDataURL(TRAY_ICON_BASE64);
}

function createTray() {
  if (tray) return;

  const icon = getAppIcon();
  tray = new Tray(icon);
  tray.setToolTip("Clipboard Brain (Running in background)");

  updateTrayMenu();

  // Click on tray icon toggles window visibility
  tray.on("click", () => {
    if (!mainWindow) {
      createWindow();
    } else if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Double click restores and focuses the window
  tray.on("double-click", () => {
    if (!mainWindow) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Balloon click restores window
  tray.on("balloon-click", () => {
    if (!mainWindow) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function updateTrayMenu() {
  if (!tray) return;

  const isPaused = monitor?.isPaused() ?? false;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Clipboard Brain",
      click: () => {
        if (!mainWindow) {
          createWindow();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: isPaused ? "▶ Resume Capture" : "⏸ Pause Capture",
      click: () => {
        if (monitor) {
          monitor.setPaused(!isPaused);
          updateTrayMenu();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit Clipboard Brain",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

async function createWindow() {
  const appIcon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 950,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    title: "Clipboard Brain",
    icon: appIcon,
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

  // Intercept window close (X button) to keep running in background
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();

      // Notify the user on Windows system tray
      if (tray && process.platform === "win32") {
        try {
          tray.displayBalloon({
            iconType: "info",
            title: "Clipboard Brain",
            content: "Software is still running in the tray. Double-click or click the tray icon to reopen.",
          });
        } catch {
          // Ignore if balloon fails
        }
      }
      return false;
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function bootstrap() {
  try {
    // 1. Initialize persistent database
    db = new DatabaseService();
    await db.initialize();

    // Load persisted settings (allowed content types)
    const settings = db.getSettings();

    // 2. Initialize clipboard monitor with saved permissions
    monitor = new ClipboardMonitor({
      pollIntervalMs: 700,
      allowedContentTypes: settings.allowedContentTypes,
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

    // 4. Create System Tray icon in Windows taskbar
    createTray();

    // 5. Create UI Window
    await createWindow();

    // 6. Start clipboard monitoring (runs continuously in background)
    monitor.start();

    // 7. Schedule hourly background auto-cleanup for items older than 1 week (7 days)
    cleanupTimer = setInterval(() => {
      db?.cleanupExpiredItems().catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("Hourly expired items cleanup error:", err);
        }
      });
    }, 60 * 60 * 1000);
  } catch (err) {
    console.error("Fatal startup error in Clipboard Brain main process:", err);
    app.quit();
  }
}

// When second instance is launched (e.g. desktop shortcut clicked again), restore existing window
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(bootstrap);

// Prevent app from quitting when all windows are closed
app.on("window-all-closed", () => {
  // Keep background monitoring alive
});

app.on("activate", () => {
  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on("before-quit", async () => {
  isQuitting = true;
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
  if (monitor) {
    monitor.stop();
  }
  if (tray) {
    tray.destroy();
    tray = null;
  }
  unregisterIpcHandlers();
  if (db) {
    await db.close();
  }
});
