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

// 16x16 crisp clipboard tray icon PNG (base64)
const TRAY_ICON_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAWElEQVR42mNgwA2EGBgY/qMZjM1AdDMuTdgMQTeDG4tqBnQbsGkGmcCGxXJ0G8AMYyDFBmzm4NEMchG65egGoJuB1V1INoP0oJsN0kG8bgA3e0i1AKsboIZP0LgZzUeYm7GZg88AACu5JBH/GSmBAAAAAElFTkSuQmCC";

function createTray() {
  if (tray) return;

  const icon = nativeImage.createFromDataURL(TRAY_ICON_BASE64);
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

  // Intercept window close (X button) to keep running in background
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
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

    // 4. Create System Tray icon in Windows taskbar
    createTray();

    // 5. Create UI Window
    await createWindow();

    // 6. Start clipboard monitoring (runs continuously in background)
    monitor.start();
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
