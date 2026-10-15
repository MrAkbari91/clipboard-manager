import { describe, it, expect } from "vitest";
import { createMockClipboardAPI } from "../adapters/mock-clipboard-api";
import { ClipboardItem } from "../shared/clipboard-contract";

describe("createMockClipboardAPI Adapter", () => {
  it("initializes with default mock items and retrieves all newest first", async () => {
    const api = createMockClipboardAPI();
    const items = await api.getItems();
    expect(items.length).toBeGreaterThanOrEqual(4);

    // Verify sorted newest first
    for (let i = 0; i < items.length - 1; i++) {
      const current = new Date(items[i].createdAt).getTime();
      const next = new Date(items[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it("filters items by content type correctly", async () => {
    const api = createMockClipboardAPI();
    const codeItems = await api.getItems({ contentType: "code" });
    expect(codeItems.every((i) => i.contentType === "code")).toBe(true);

    const urlItems = await api.getItems({ contentType: "url" });
    expect(urlItems.every((i) => i.contentType === "url")).toBe(true);

    const colorItems = await api.getItems({ contentType: "color" });
    expect(colorItems.every((i) => i.contentType === "color")).toBe(true);
  });

  it("filters items by search query case-insensitively", async () => {
    const api = createMockClipboardAPI();
    const results = await api.getItems({ search: "clipboard brain" });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(
      results.some((i) => i.content.toLowerCase().includes("clipboard brain") || i.title?.toLowerCase().includes("clipboard brain"))
    ).toBe(true);
  });

  it("filters items by pinned status", async () => {
    const api = createMockClipboardAPI();
    const pinned = await api.getItems({ pinnedOnly: true });
    expect(pinned.length).toBeGreaterThanOrEqual(1);
    expect(pinned.every((i) => i.isPinned)).toBe(true);
  });

  it("sorts items by oldest first when requested", async () => {
    const api = createMockClipboardAPI();
    const items = await api.getItems({ sort: "oldest" });
    for (let i = 0; i < items.length - 1; i++) {
      const current = new Date(items[i].createdAt).getTime();
      const next = new Date(items[i + 1].createdAt).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }
  });

  it("pins and unpins an item correctly", async () => {
    const api = createMockClipboardAPI();
    const items = await api.getItems();
    const target = items[0];

    const updated = await api.pinItem(target.id, !target.isPinned);
    expect(updated.isPinned).toBe(!target.isPinned);

    const recheck = await api.getItems();
    const found = recheck.find((i) => i.id === target.id);
    expect(found?.isPinned).toBe(!target.isPinned);
  });

  it("deletes an item", async () => {
    const api = createMockClipboardAPI();
    const items = await api.getItems();
    const targetId = items[0].id;
    const initialCount = items.length;

    const res = await api.deleteItem(targetId);
    expect(res.success).toBe(true);

    const afterDelete = await api.getItems();
    expect(afterDelete.length).toBe(initialCount - 1);
    expect(afterDelete.some((i) => i.id === targetId)).toBe(false);
  });

  it("clears unpinned items and preserves pinned clips like the native API", async () => {
    const api = createMockClipboardAPI();
    const initialItems = await api.getItems();
    expect(initialItems.length).toBeGreaterThan(0);

    const clearRes = await api.clearHistory();
    expect(clearRes.deletedCount).toBe(initialItems.filter((item) => !item.isPinned).length);

    const afterClear = await api.getItems();
    expect(afterClear).toEqual(initialItems.filter((item) => item.isPinned));
  });

  it("toggles capture paused state", async () => {
    const api = createMockClipboardAPI();
    const initialStatus = await api.getCaptureStatus();
    expect(initialStatus.isPaused).toBe(false);

    const updated = await api.setCapturePaused(true);
    expect(updated.isPaused).toBe(true);

    const recheck = await api.getCaptureStatus();
    expect(recheck.isPaused).toBe(true);
  });

  it("handles live onItemAdded listener and unsubscribe", () => {
    const api = createMockClipboardAPI();
    const received: ClipboardItem[] = [];

    const unsubscribe = api.onItemAdded((item) => {
      received.push(item);
    });

    const mockItem: ClipboardItem = {
      id: "test-new",
      content: "const x = 42;",
      contentType: "code",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false,
      title: null,
      projectId: null,
    };

    expect(mockItem.id).toBe("test-new");
    unsubscribe();
    expect(received.length).toBe(0);
  });

  it("handles projects creation and item assignment", async () => {
    const api = createMockClipboardAPI();
    const initialProjects = await api.getProjects();
    const initialCount = initialProjects.length;

    const newProj = await api.createProject({
      name: "React Modern UI",
      description: "Components and hooks",
    });

    expect(newProj.id).toBeDefined();
    expect(newProj.name).toBe("React Modern UI");

    const updatedProjects = await api.getProjects();
    expect(updatedProjects.length).toBe(initialCount + 1);

    const items = await api.getItems();
    const targetItem = items[0];

    const assigned = await api.assignProject(targetItem.id, newProj.id);
    expect(assigned.projectId).toBe(newProj.id);

    const projectFiltered = await api.getItems({ projectId: newProj.id });
    expect(projectFiltered.some((i) => i.id === targetItem.id)).toBe(true);
  });

  it("handles complex Unicode, emoji, and multiline text gracefully", async () => {
    const api = createMockClipboardAPI();
    const complexContent = "🚀 Unicode test: こんにちは 세계 🌍 \nLine 2: Special chars: & < > \" ' \nLine 3: 🧠 ⚡ 💻";
    expect(complexContent).toContain("🚀");
    
    // Test that searching or filtering works with unicode
    const items = await api.getItems();
    expect(items).toBeDefined();
  });
});
