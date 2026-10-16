import { describe, it, expect } from "vitest";
import { ClipboardMonitor } from "../clipboard-monitor";

describe("ClipboardMonitor - Content Type Detection", () => {
  it("detects all hex and modern CSS color formats correctly", () => {
    // Hex
    expect(ClipboardMonitor.detectContentType("#ffffff")).toBe("color");
    expect(ClipboardMonitor.detectContentType("#FFF")).toBe("color");
    expect(ClipboardMonitor.detectContentType("#3b82f6")).toBe("color");
    expect(ClipboardMonitor.detectContentType("#00ff0080")).toBe("color");

    // RGB / RGBA
    expect(ClipboardMonitor.detectContentType("rgb(255, 0, 0)")).toBe("color");
    expect(ClipboardMonitor.detectContentType("rgba(0, 0, 0, 0.5)")).toBe("color");

    // HSL / HSLA
    expect(ClipboardMonitor.detectContentType("hsl(200, 50%, 50%)")).toBe("color");
    expect(ClipboardMonitor.detectContentType("hsla(120, 100%, 50%, 0.8)")).toBe("color");

    // OKLCH / LAB
    expect(ClipboardMonitor.detectContentType("oklch(0.6 0.25 150)")).toBe("color");
    expect(ClipboardMonitor.detectContentType("lab(50% 40 59.5)")).toBe("color");
  });

  it("detects videos (YouTube, Vimeo, and video file extensions) correctly", () => {
    expect(ClipboardMonitor.detectContentType("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("video");
    expect(ClipboardMonitor.detectContentType("https://youtu.be/dQw4w9WgXcQ")).toBe("video");
    expect(ClipboardMonitor.detectContentType("https://youtube.com/shorts/abc123xyz")).toBe("video");
    expect(ClipboardMonitor.detectContentType("https://vimeo.com/123456789")).toBe("video");
    expect(ClipboardMonitor.detectContentType("https://cdn.example.com/assets/sample-video.mp4")).toBe("video");
    expect(ClipboardMonitor.detectContentType("https://media.org/clip.webm?source=web")).toBe("video");
  });

  it("detects JSON formats correctly", () => {
    const jsonObject = `{\n  "name": "Clipboard Brain",\n  "version": "1.0.0"\n}`;
    expect(ClipboardMonitor.detectContentType(jsonObject)).toBe("json");

    const jsonArray = `[{"id": 1, "status": "active"}, {"id": 2, "status": "pending"}]`;
    expect(ClipboardMonitor.detectContentType(jsonArray)).toBe("json");
  });

  it("detects emojis correctly", () => {
    expect(ClipboardMonitor.detectContentType("😀🎉🚀")).toBe("emoji");
    expect(ClipboardMonitor.detectContentType("🔥")).toBe("emoji");
    expect(ClipboardMonitor.detectContentType("❤️ ✨ 👍")).toBe("emoji");
  });

  it("detects general URLs correctly", () => {
    expect(ClipboardMonitor.detectContentType("https://github.com")).toBe("url");
    expect(ClipboardMonitor.detectContentType("http://localhost:3000/dashboard")).toBe("url");
    expect(ClipboardMonitor.detectContentType("https://example.com/path?query=1&foo=bar")).toBe("url");
  });

  it("detects code snippets correctly", () => {
    const jsCode = `function calculateTotal(items) {
      return items.reduce((acc, curr) => acc + curr.price, 0);
    }`;
    expect(ClipboardMonitor.detectContentType(jsCode)).toBe("code");

    const sqlSnippet = "SELECT id, name, created_at FROM users WHERE is_active = 1;";
    expect(ClipboardMonitor.detectContentType(sqlSnippet)).toBe("code");

    const htmlSnippet = `<div className="container">\n  <h1>Title</h1>\n</div>`;
    expect(ClipboardMonitor.detectContentType(htmlSnippet)).toBe("code");
  });

  it("detects plain text correctly", () => {
    expect(ClipboardMonitor.detectContentType("Hello world!")).toBe("text");
    expect(ClipboardMonitor.detectContentType("This is a reminder to buy groceries.")).toBe("text");
  });
});

describe("ClipboardMonitor - Title Derivation", () => {
  it("derives domain-based title for URLs", () => {
    expect(ClipboardMonitor.deriveTitle("https://github.com/facebook/react", "url")).toBe("github.com/facebook/react");
  });

  it("derives uppercase title for colors", () => {
    expect(ClipboardMonitor.deriveTitle("#3b82f6", "color")).toBe("#3B82F6");
    expect(ClipboardMonitor.deriveTitle("rgb(255, 0, 0)", "color")).toBe("RGB(255, 0, 0)");
  });

  it("derives clear titles for JSON", () => {
    expect(ClipboardMonitor.deriveTitle('{"a": 1, "b": 2}', "json")).toBe("JSON Object (2 keys)");
    expect(ClipboardMonitor.deriveTitle("[1, 2, 3, 4]", "json")).toBe("JSON Array (4 items)");
  });

  it("derives video titles for videos", () => {
    expect(ClipboardMonitor.deriveTitle("https://youtu.be/xyz", "video")).toBe("YouTube Video");
    expect(ClipboardMonitor.deriveTitle("https://vimeo.com/123", "video")).toBe("Vimeo Video");
  });

  it("derives emoji as title", () => {
    expect(ClipboardMonitor.deriveTitle("🔥🚀", "emoji")).toBe("🔥🚀");
  });

  it("derives first line for text", () => {
    const multiline = "First Line of Text\nSecond Line\nThird Line";
    expect(ClipboardMonitor.deriveTitle(multiline, "text")).toBe("First Line of Text");
  });

  it("truncates excessively long titles", () => {
    const longLine = "a".repeat(100);
    const title = ClipboardMonitor.deriveTitle(longLine, "text");
    expect(title?.length).toBe(60);
    expect(title?.endsWith("...")).toBe(true);
  });
});

describe("ClipboardMonitor - Pause and Resume", () => {
  it("toggles pause state properly", () => {
    const monitor = new ClipboardMonitor();
    expect(monitor.isPaused()).toBe(false);

    monitor.setPaused(true);
    expect(monitor.isPaused()).toBe(true);

    monitor.setPaused(false);
    expect(monitor.isPaused()).toBe(false);
  });
});

describe("ClipboardMonitor - Content Type Permissions", () => {
  it("defaults to allowing all content types", () => {
    const monitor = new ClipboardMonitor();
    expect(monitor.isTypeAllowed("text")).toBe(true);
    expect(monitor.isTypeAllowed("code")).toBe(true);
    expect(monitor.isTypeAllowed("url")).toBe(true);
    expect(monitor.isTypeAllowed("color")).toBe(true);
    expect(monitor.isTypeAllowed("image")).toBe(true);
    expect(monitor.isTypeAllowed("video")).toBe(true);
    expect(monitor.isTypeAllowed("json")).toBe(true);
    expect(monitor.isTypeAllowed("emoji")).toBe(true);
    expect(monitor.getAllowedTypes().length).toBe(8);
  });

  it("updates allowed content types dynamically", () => {
    const monitor = new ClipboardMonitor({
      allowedContentTypes: ["text", "code"],
    });

    expect(monitor.isTypeAllowed("text")).toBe(true);
    expect(monitor.isTypeAllowed("code")).toBe(true);
    expect(monitor.isTypeAllowed("image")).toBe(false);
    expect(monitor.isTypeAllowed("url")).toBe(false);

    monitor.setAllowedTypes(["image", "url", "video"]);
    expect(monitor.isTypeAllowed("text")).toBe(false);
    expect(monitor.isTypeAllowed("image")).toBe(true);
    expect(monitor.isTypeAllowed("url")).toBe(true);
    expect(monitor.isTypeAllowed("video")).toBe(true);
  });
});
