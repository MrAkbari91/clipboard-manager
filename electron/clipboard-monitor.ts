import { clipboard } from "electron";
import { ClipboardContentType, ClipboardItem } from "../src/shared/clipboard-contract";

export interface ClipboardMonitorOptions {
  pollIntervalMs?: number;
  maxContentLength?: number;
  onNewItem?: (itemData: Omit<ClipboardItem, "id" | "createdAt" | "updatedAt">) => Promise<ClipboardItem | null>;
}

export class ClipboardMonitor {
  private pollIntervalMs: number;
  private maxContentLength: number;
  private timer: NodeJS.Timeout | null = null;
  private lastContent: string | null = null;
  private paused: boolean = false;
  private onNewItem?: (itemData: Omit<ClipboardItem, "id" | "createdAt" | "updatedAt">) => Promise<ClipboardItem | null>;

  constructor(options: ClipboardMonitorOptions = {}) {
    this.pollIntervalMs = options.pollIntervalMs ?? 800;
    this.maxContentLength = options.maxContentLength ?? 1_000_000; // 1MB limit for safety
    this.onNewItem = options.onNewItem;
  }

  public start(): void {
    if (this.timer) {
      return;
    }

    try {
      // Initialize with current clipboard content so we only capture future changes
      const current = clipboard.readText().trim();
      this.lastContent = current.length > 0 ? current : null;
    } catch {
      this.lastContent = null;
    }

    this.timer = setInterval(() => {
      this.checkClipboard();
    }, this.pollIntervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public setPaused(paused: boolean): boolean {
    this.paused = paused;
    return this.paused;
  }

  public async checkClipboard(): Promise<void> {
    if (this.paused) {
      return;
    }

    try {
      const rawText = clipboard.readText();
      if (!rawText) {
        return;
      }

      const text = rawText.trim();
      if (!text) {
        return;
      }

      // Ignore if text has not changed
      if (text === this.lastContent) {
        return;
      }

      // Handle excessively large payloads safely
      if (text.length > this.maxContentLength) {
        return;
      }

      this.lastContent = text;

      const contentType = ClipboardMonitor.detectContentType(text);
      const title = ClipboardMonitor.deriveTitle(text, contentType);

      if (this.onNewItem) {
        await this.onNewItem({
          content: text,
          contentType,
          isPinned: false,
          title,
          projectId: null,
        });
      }
    } catch (err) {
      // In production, avoid logging raw clipboard text
      if (process.env.NODE_ENV !== "production") {
        console.error("ClipboardMonitor error:", err);
      }
    }
  }

  public static detectContentType(text: string): ClipboardContentType {
    const trimmed = text.trim();

    // 1. Color check (hex colors, rgb, rgba, hsl, hsla)
    const hexColorRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    const cssColorRegex = /^(?:rgb|rgba|hsl|hsla)\(\s*[\d.%\s,/-]+\s*\)$/i;
    if (hexColorRegex.test(trimmed) || cssColorRegex.test(trimmed)) {
      return "color";
    }

    // 2. URL check
    try {
      if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
        new URL(trimmed);
        return "url";
      }
    } catch {
      // not a valid URL
    }

    // 3. Likely code check
    if (this.isLikelyCode(trimmed)) {
      return "code";
    }

    return "text";
  }

  public static isLikelyCode(text: string): boolean {
    // Check for JSON
    if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
      try {
        JSON.parse(text);
        return true;
      } catch {
        // continue checks
      }
    }

    // Common programming patterns
    const codeKeywords = [
      /\bfunction\s*\w*\s*\(/,
      /\bconst\s+\w+\s*=/,
      /\blet\s+\w+\s*=/,
      /\bvar\s+\w+\s*=/,
      /\bdef\s+\w+\s*\(/,
      /\bclass\s+\w+/,
      /\bimport\s+.*from\s+['"]/,
      /\bexport\s+(default\s+)?(function|class|const|let|var|type|interface)/,
      /\breturn\s+[^\n;]+;?/,
      /=>\s*[{]/,
      /<\/?[a-z][\s\S]*>/i, // HTML/XML tags
      /\bpublic\s+(static\s+)?\w+\s+\w+\s*\(/,
      /\bSELECT\s+.+\s+FROM\s+/i,
      /\bINSERT\s+INTO\s+/i,
      /\bUPDATE\s+.+\s+SET\s+/i,
    ];

    let matchCount = 0;
    for (const pattern of codeKeywords) {
      if (pattern.test(text)) {
        matchCount++;
      }
    }

    if (matchCount >= 1 && (text.includes(";") || text.includes("{") || text.includes("(") || text.includes("\n"))) {
      return true;
    }

    // Multi-line indentation patterns with syntax characters
    const lines = text.split("\n");
    if (lines.length >= 3) {
      let indentedLines = 0;
      let syntaxChars = 0;
      for (const line of lines) {
        if (/^\s{2,}\S/.test(line)) {
          indentedLines++;
        }
        if (/[{}();[\],<>]/.test(line)) {
          syntaxChars++;
        }
      }
      if (indentedLines >= 2 && syntaxChars >= 2) {
        return true;
      }
    }

    return false;
  }

  public static deriveTitle(text: string, contentType: ClipboardContentType): string | null {
    if (contentType === "url") {
      try {
        const parsed = new URL(text);
        return parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "");
      } catch {
        return "Link";
      }
    }

    if (contentType === "color") {
      return text.toUpperCase();
    }

    const firstLine = text.split("\n")[0].trim();
    if (firstLine.length > 0 && firstLine.length <= 60) {
      return firstLine;
    } else if (firstLine.length > 60) {
      return firstLine.substring(0, 57) + "...";
    }

    return null;
  }
}
