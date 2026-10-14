import { describe, it, expect } from "vitest";
import { ClipboardMonitor } from "../clipboard-monitor";

describe("ClipboardMonitor - Content Type Detection", () => {
  it("detects hex color codes correctly", () => {
    expect(ClipboardMonitor.detectContentType("#ffffff")).toBe("color");
    expect(ClipboardMonitor.detectContentType("#FFF")).toBe("color");
    expect(ClipboardMonitor.detectContentType("#3b82f6")).toBe("color");
    expect(ClipboardMonitor.detectContentType("#00ff0080")).toBe("color");
  });

  it("detects css colors correctly", () => {
    expect(ClipboardMonitor.detectContentType("rgb(255, 0, 0)")).toBe("color");
    expect(ClipboardMonitor.detectContentType("rgba(0, 0, 0, 0.5)")).toBe("color");
    expect(ClipboardMonitor.detectContentType("hsl(200, 50%, 50%)")).toBe("color");
  });

  it("detects valid URLs correctly", () => {
    expect(ClipboardMonitor.detectContentType("https://github.com")).toBe("url");
    expect(ClipboardMonitor.detectContentType("http://localhost:3000/dashboard")).toBe("url");
    expect(ClipboardMonitor.detectContentType("https://example.com/path?query=1&foo=bar")).toBe("url");
  });

  it("detects code snippets correctly", () => {
    const jsCode = `function calculateTotal(items) {
      return items.reduce((acc, curr) => acc + curr.price, 0);
    }`;
    expect(ClipboardMonitor.detectContentType(jsCode)).toBe("code");

    const jsonSnippet = `{\n  "name": "Clipboard Brain",\n  "version": "1.0.0"\n}`;
    expect(ClipboardMonitor.detectContentType(jsonSnippet)).toBe("code");

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
