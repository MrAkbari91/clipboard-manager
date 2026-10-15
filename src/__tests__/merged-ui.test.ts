import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClipboardContentType, ClipboardItem } from "../shared/clipboard-contract";
import { ClipboardCard } from "../components/clipboard/ClipboardCard";
import { PreviewModal } from "../components/clipboard/PreviewModal";
import { SidePreviewDrawer } from "../components/clipboard/SidePreviewDrawer";
import { FilterBar } from "../components/clipboard/FilterBar";
import { RichContentPreview } from "../components/clipboard/RichContentPreview";
import { createMockClipboardAPI } from "../adapters/mock-clipboard-api";
import fs from "node:fs";
import path from "node:path";

const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4WQAAAAASUVORK5CYII=";
const makeItem = (contentType: ClipboardContentType, content: string): ClipboardItem => ({
  id: "integration-clip", contentType, content, title: null, projectId: null,
  isPinned: false, createdAt: "2026-10-15T08:00:00Z", updatedAt: "2026-10-15T08:00:00Z",
});
const actions = {
  projects: [], onCopy: async () => true, onPin: async () => true,
  onDelete: async () => true, onAssignProject: async () => true, onOpenPreview: () => {},
};
const cases: [ClipboardContentType, string, string][] = [
  ["image", image, "<img"], ["video", "https://youtu.be/example", "Video source"],
  ["json", '{"ready":true,"count":2}', "&quot;ready&quot;: true"], ["emoji", "🚀 🎉", "🚀 🎉"],
];

describe("Core formats integrated with the redesigned UI", () => {
  it.each(cases)("renders %s in cards, modal and inspector without losing copy actions", (type, content, expected) => {
    const item = makeItem(type, content);
    const card = renderToStaticMarkup(React.createElement(ClipboardCard, { ...actions, item }));
    const modal = renderToStaticMarkup(React.createElement(PreviewModal, { ...actions, item, onClose: () => {} }));
    const drawer = renderToStaticMarkup(React.createElement(SidePreviewDrawer, { ...actions, item, onClose: () => {} }));
    for (const markup of [card, modal, drawer]) {
      expect(markup).toContain(expected);
      expect(markup).not.toContain("undefined");
      expect(markup.toLowerCase()).toContain("copy");
    }
    expect(item.content).toBe(content); // Formatting the preview must not mutate native copy data.
  });

  it("exposes all eight core categories and preserves existing filters", () => {
    const markup = renderToStaticMarkup(React.createElement(FilterBar, {
      selectedType: "image", onSelectType: () => {}, pinnedOnly: false,
      onTogglePinnedOnly: () => {}, sort: "newest", onSortChange: () => {},
      onResetFilters: () => {}, isFiltered: true,
    }));
    for (const label of ["Everything", "Text", "Code", "Links", "Colors", "Images", "Videos", "JSON", "Emoji", "Pinned"]) {
      expect(markup).toContain(label);
    }
    expect(markup).toContain('aria-pressed="true"');
  });

  it("does not fetch remote images or turn non-web video sources into executable links", () => {
    const remoteImage = renderToStaticMarkup(React.createElement(RichContentPreview, { item: makeItem("image", "https://example.com/private.png") }));
    const unsafeVideo = renderToStaticMarkup(React.createElement(RichContentPreview, { item: makeItem("video", "javascript:alert(1)") }));
    expect(remoteImage).not.toContain("<img");
    expect(unsafeVideo).not.toContain("href=");
  });

  it("keeps malformed legacy JSON readable instead of crashing", () => {
    const markup = renderToStaticMarkup(React.createElement(RichContentPreview, { item: makeItem("json", "{unfinished") }));
    expect(markup).toContain("{unfinished");
  });

  it("allows native raster previews in the page CSP without allowing remote images", () => {
    const html = fs.readFileSync(path.resolve("index.html"), "utf8");
    expect(html).toContain("img-src 'self' data:;");
  });

  it("clearly rejects storage-folder actions in the browser adapter", async () => {
    await expect(createMockClipboardAPI().openStorageFolder("image")).rejects.toThrow("desktop application");
  });
});
