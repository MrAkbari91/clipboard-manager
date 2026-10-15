import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DatabaseService } from "../db/database";
import path from "path";
import fs from "fs";

describe("DatabaseService - SQLite Persistence & Operations", () => {
  const testDbDir = path.resolve(process.cwd(), ".test-data");
  const testDbPath = path.join(testDbDir, "test-clipboard.db");
  let db: DatabaseService;

  beforeAll(async () => {
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDbDir, { recursive: true });

    db = new DatabaseService(testDbPath);
    await db.initialize();
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  });

  it("initializes database file on first run", () => {
    expect(fs.existsSync(testDbPath)).toBe(true);
  });

  it("preserves the core category folders and saves native image and JSON content", async () => {
    for (const category of ["image", "url", "video", "text", "json", "emoji", "color", "code"] as const) {
      expect(fs.statSync(db.getStorageDirectory(category)).isDirectory()).toBe(true);
    }
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4WQAAAAASUVORK5CYII=", "base64");
    const image = await db.addItem({ contentType: "image", content: `data:image/png;base64,${png.toString("base64")}` });
    expect(fs.readFileSync(path.join(db.getStorageDirectory("image"), `${image.id}.png`))).toEqual(png);
    const json = await db.addItem({ contentType: "json", content: '{"merged":true}' });
    expect(JSON.parse(fs.readFileSync(path.join(db.getStorageDirectory("json"), `${json.id}.json`), "utf8"))).toEqual({ merged: true });
    expect((await db.getItems({ contentType: "image" })).some((item) => item.id === image.id)).toBe(true);
  });

  it("adds clipboard items and maps fields properly", async () => {
    const item = await db.addItem({
      content: "const a = 42;",
      contentType: "code",
      title: "Variable a",
    });

    expect(item.id).toBeDefined();
    expect(item.content).toBe("const a = 42;");
    expect(item.contentType).toBe("code");
    expect(item.title).toBe("Variable a");
    expect(item.isPinned).toBe(false);
    expect(item.createdAt).toBeDefined();
    expect(item.updatedAt).toBeDefined();
  });

  it("deduplicates identical content by bringing it to top", async () => {
    const first = await db.addItem({
      content: "Duplicate content test",
      contentType: "text",
      title: "Dup 1",
    });

    // Wait 10ms so timestamp can advance
    await new Promise((r) => setTimeout(r, 10));

    const second = await db.addItem({
      content: "Duplicate content test",
      contentType: "text",
      title: "Dup 2",
    });

    expect(second.id).toBe(first.id);
    expect(new Date(second.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(first.updatedAt).getTime());

    // Verify only one item exists for this content
    const items = await db.getItems({ search: "Duplicate content test" });
    expect(items.length).toBe(1);
  });

  it("filters items by content type", async () => {
    await db.addItem({ content: "https://vitejs.dev", contentType: "url" });
    await db.addItem({ content: "#ff5500", contentType: "color" });

    const urls = await db.getItems({ contentType: "url" });
    expect(urls.every((i) => i.contentType === "url")).toBe(true);
    expect(urls.some((i) => i.content === "https://vitejs.dev")).toBe(true);

    const colors = await db.getItems({ contentType: "color" });
    expect(colors.every((i) => i.contentType === "color")).toBe(true);
    expect(colors.some((i) => i.content === "#ff5500")).toBe(true);
  });

  it("pins and unpins items", async () => {
    const item = await db.addItem({
      content: "Important snippet to pin",
      contentType: "text",
    });

    const pinned = await db.pinItem(item.id, true);
    expect(pinned.isPinned).toBe(true);

    const pinnedItems = await db.getItems({ pinnedOnly: true });
    expect(pinnedItems.some((i) => i.id === item.id)).toBe(true);

    const unpinned = await db.pinItem(item.id, false);
    expect(unpinned.isPinned).toBe(false);
  });

  it("creates projects and assigns items to projects", async () => {
    const project = await db.createProject({
      name: "React Project",
      description: "Code snippets for React",
    });

    expect(project.id).toBeDefined();
    expect(project.name).toBe("React Project");

    const item = await db.addItem({
      content: "useEffect(() => {}, []);",
      contentType: "code",
    });

    const assigned = await db.assignProject(item.id, project.id);
    expect(assigned.projectId).toBe(project.id);

    const projectItems = await db.getItems({ projectId: project.id });
    expect(projectItems.some((i) => i.id === item.id)).toBe(true);
  });

  it("searches across content and title", async () => {
    await db.addItem({
      content: "UniqueKeyword123 in content body",
      contentType: "text",
      title: "Normal Title",
    });

    await db.addItem({
      content: "Plain body text",
      contentType: "text",
      title: "UniqueKeyword123 in title",
    });

    const matches = await db.getItems({ search: "UniqueKeyword123" });
    expect(matches.length).toBe(2);
  });

  it("deletes items", async () => {
    const item = await db.addItem({
      content: "Delete me soon",
      contentType: "text",
    });

    const delResult = await db.deleteItem(item.id);
    expect(delResult.success).toBe(true);

    const fetched = await db.getItemById(item.id);
    expect(fetched).toBeNull();
  });

  it("clearHistory preserves pinned items and deletes unpinned items", async () => {
    const unpinned = await db.addItem({
      content: "Unpinned item to be cleared",
      contentType: "text",
    });

    const toPin = await db.addItem({
      content: "Pinned favorite that MUST be preserved",
      contentType: "text",
    });
    await db.pinItem(toPin.id, true);

    const clearRes = await db.clearHistory();
    expect(clearRes.deletedCount).toBeGreaterThan(0);

    const preserved = await db.getItemById(toPin.id);
    expect(preserved).not.toBeNull();
    expect(preserved?.isPinned).toBe(true);

    const removed = await db.getItemById(unpinned.id);
    expect(removed).toBeNull();
  });
});
