import { clipboard } from "electron";
import crypto from "crypto";
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
  private lastImageHash: string | null = null;
  private paused: boolean = false;
  private onNewItem?: (itemData: Omit<ClipboardItem, "id" | "createdAt" | "updatedAt">) => Promise<ClipboardItem | null>;

  constructor(options: ClipboardMonitorOptions = {}) {
    this.pollIntervalMs = options.pollIntervalMs ?? 800;
    this.maxContentLength = options.maxContentLength ?? 5_000_000; // 5MB limit
    this.onNewItem = options.onNewItem;
  }

  public start(): void {
    if (this.timer) {
      return;
    }

    try {
      // Initialize state with current clipboard content
      const image = clipboard.readImage();
      if (!image.isEmpty()) {
        const png = image.toPNG();
        this.lastImageHash = crypto.createHash("md5").update(png).digest("hex");
      } else {
        const current = clipboard.readText().trim();
        this.lastContent = current.length > 0 ? current : null;
      }
    } catch {
      this.lastContent = null;
      this.lastImageHash = null;
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
      // 1. Check for Image in clipboard first
      const image = clipboard.readImage();
      if (!image.isEmpty()) {
        const size = image.getSize();
        if (size.width > 0 && size.height > 0) {
          const pngBuffer = image.toPNG();
          const hash = crypto.createHash("md5").update(pngBuffer).digest("hex");

          if (hash !== this.lastImageHash) {
            this.lastImageHash = hash;
            this.lastContent = null; // Clear last text so subsequent text copy triggers

            const dataUrl = image.toDataURL();
            const title = `Image ${size.width}x${size.height}`;

            if (this.onNewItem) {
              await this.onNewItem({
                content: dataUrl,
                contentType: "image",
                isPinned: false,
                title,
                projectId: null,
              });
            }
            return;
          }
          return;
        }
      }

      // 2. Check for Text in clipboard
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
      this.lastImageHash = null; // Clear image hash so subsequent screenshot triggers

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
      if (process.env.NODE_ENV !== "production") {
        console.error("ClipboardMonitor error:", err);
      }
    }
  }

  public static detectContentType(text: string): ClipboardContentType {
    const trimmed = text.trim();

    // 1. Color check (Hex 3/4/6/8 digits, rgb, rgba, hsl, hsla, hsv, oklch, oklab, lab, lch)
    const hexColorRegex = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    const cssColorRegex = /^(?:rgb|rgba|hsl|hsla|hsv|hsb|oklch|oklab|lab|lch|color)\s*\([^)]+\)$/i;
    if (hexColorRegex.test(trimmed) || cssColorRegex.test(trimmed)) {
      return "color";
    }

    // 2. Emoji check (pure emojis / pictographs)
    const emojiRegex = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji_Modifier}|\p{Emoji_Modifier_Base}|\u200D|\uFE0F|\s)+$/u;
    if (emojiRegex.test(trimmed) && /\p{Extended_Pictographic}/u.test(trimmed) && trimmed.length <= 60) {
      return "emoji";
    }

    // 3. JSON check
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        JSON.parse(trimmed);
        return "json";
      } catch {
        // Not valid JSON, continue checks
      }
    }

    // 4. Video check (YouTube, Vimeo, Twitch, or video file extensions)
    const videoUrlPatterns = [
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/i,
      /vimeo\.com\/\d+/i,
      /\.(?:mp4|mkv|mov|webm|avi|flv|m4v|wmv)(?:\?.*)?$/i,
    ];
    for (const pattern of videoUrlPatterns) {
      if (pattern.test(trimmed)) {
        return "video";
      }
    }

    // 5. General URL check
    try {
      if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
        new URL(trimmed);
        return "url";
      }
    } catch {
      // not a valid URL
    }

    // 6. Likely code check
    if (this.isLikelyCode(trimmed)) {
      return "code";
    }

    return "text";
  }

  public static isLikelyCode(text: string): boolean {
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
    if (contentType === "image") {
      return "Image";
    }

    if (contentType === "color") {
      return text.trim().toUpperCase();
    }

    if (contentType === "emoji") {
      return text.trim();
    }

    if (contentType === "json") {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return `JSON Array (${parsed.length} items)`;
        }
        return `JSON Object (${Object.keys(parsed).length} keys)`;
      } catch {
        return "JSON Data";
      }
    }

    if (contentType === "video") {
      if (text.includes("youtube.com") || text.includes("youtu.be")) {
        return "YouTube Video";
      }
      if (text.includes("vimeo.com")) {
        return "Vimeo Video";
      }
      const filename = text.split("/").pop()?.split("?")[0];
      return filename ? `Video: ${filename}` : "Video Link";
    }

    if (contentType === "url") {
      try {
        const parsed = new URL(text);
        return parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "");
      } catch {
        return "Link";
      }
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
