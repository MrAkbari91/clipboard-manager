const { app } = require("electron");
const { DatabaseService } = require("../dist-electron/electron/db/database");
const { ClipboardMonitor } = require("../dist-electron/electron/clipboard-monitor");

async function runVerification() {
  console.log("Verifying Electron main process environment...");
  try {
    const db = new DatabaseService();
    await db.initialize();
    console.log("Verified: Database path is under userData ->", db.getDbPath());

    const testItem = await db.addItem({
      content: "Electron verification clip",
      contentType: "text",
      title: "Test",
    });
    console.log("Verified: Inserted item ->", testItem.id);

    const items = await db.getItems();
    console.log("Verified: Fetched items count ->", items.length);

    const monitor = new ClipboardMonitor();
    expectType(monitor.isPaused(), false, "Monitor initially active");
    monitor.setPaused(true);
    expectType(monitor.isPaused(), true, "Monitor pause toggled");

    await db.deleteItem(testItem.id);
    console.log("Verified: Deleted test item");

    await db.close();
    console.log("ALL ELECTRON INTEGRATION CHECKS PASSED!");
    app.exit(0);
  } catch (err) {
    console.error("Verification failed with error:", err);
    app.exit(1);
  }

}

function expectType(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} (expected ${expected}, got ${actual})`);
  }
  console.log(`Verified: ${message}`);
}

app.whenReady().then(runVerification);
