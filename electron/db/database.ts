import { app } from "electron";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import {
  ClipboardContentType,
  ClipboardItem,
  ClipboardQuery,
  Project,
} from "../../src/shared/clipboard-contract";

export class DatabaseService {
  private prisma: PrismaClient | null = null;
  private dbPath: string;
  private storageDir: string;
  private maxHistoryLimit: number = 2000;
  private maxRetentionDays: number = 7;

  constructor(customDbPath?: string) {
    this.dbPath = customDbPath ?? DatabaseService.resolveDatabasePath();
    this.storageDir = path.join(path.dirname(this.dbPath), "storage");
    this.ensureStorageFolders();
  }

  public static resolveDatabasePath(): string {
    try {
      if (app && typeof app.getPath === "function") {
        const userDataPath = app.getPath("userData");
        if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
        }
        return path.join(userDataPath, "clipboard-brain.db");
      }
    } catch {
      // app not ready or running outside Electron
    }

    const fallbackDir = path.resolve(process.cwd(), ".data");
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    return path.join(fallbackDir, "clipboard-brain.db");
  }

  private ensureStorageFolders(): void {
    const categories = ["images", "urls", "videos", "text", "json", "emoji", "colors", "code"];
    for (const cat of categories) {
      const folderPath = path.join(this.storageDir, cat);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    }
  }

  public static getCategoryFolderName(type: ClipboardContentType): string {
    switch (type) {
      case "image":
        return "images";
      case "url":
        return "urls";
      case "video":
        return "videos";
      case "json":
        return "json";
      case "emoji":
        return "emoji";
      case "color":
        return "colors";
      case "code":
        return "code";
      default:
        return "text";
    }
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  public getStorageDirectory(category?: string): string {
    if (category && category !== "all") {
      const folder = DatabaseService.getCategoryFolderName(category as ClipboardContentType);
      const target = path.join(this.storageDir, folder);
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
      }
      return target;
    }
    return this.storageDir;
  }

  public async initialize(): Promise<void> {
    if (this.prisma) {
      return;
    }

    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const dbUrl = `file:${this.dbPath.replace(/\\/g, "/")}`;
    process.env.DATABASE_URL = dbUrl;

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });

    await this.prisma.$connect();
    await this.runMigrations();
    // Run 1-week auto-cleanup on startup
    await this.cleanupExpiredItems().catch(() => {});
  }

  private async runMigrations(): Promise<void> {
    if (!this.prisma) return;

    // Create migrations tracker table
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_migrations" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL UNIQUE,
        "applied_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const applied: Array<{ name: string }> = await this.prisma.$queryRawUnsafe(`
      SELECT "name" FROM "_migrations" WHERE "name" = '20261014090000_init';
    `);

    if (applied.length === 0) {
      // Execute initial schema migration
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ClipboardItem" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "content" TEXT NOT NULL,
          "contentType" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL,
          "isPinned" BOOLEAN NOT NULL DEFAULT false,
          "title" TEXT,
          "projectId" TEXT,
          CONSTRAINT "ClipboardItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Project" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Tag" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ClipboardItemTag" (
          "itemId" TEXT NOT NULL,
          "tagId" TEXT NOT NULL,
          PRIMARY KEY ("itemId", "tagId"),
          CONSTRAINT "ClipboardItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ClipboardItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ClipboardItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);

      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ClipboardItem_createdAt_idx" ON "ClipboardItem"("createdAt");`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ClipboardItem_contentType_idx" ON "ClipboardItem"("contentType");`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ClipboardItem_isPinned_idx" ON "ClipboardItem"("isPinned");`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ClipboardItem_projectId_idx" ON "ClipboardItem"("projectId");`);
      await this.prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_key" ON "Tag"("name");`);

      await this.prisma.$executeRawUnsafe(`
        INSERT INTO "_migrations" ("name") VALUES ('20261014090000_init');
      `);
    }
  }

  public async close(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
  }

  private mapItem(record: any): ClipboardItem {
    return {
      id: record.id,
      content: record.content,
      contentType: record.contentType as ClipboardContentType,
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : String(record.createdAt),
      updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : String(record.updatedAt),
      isPinned: Boolean(record.isPinned),
      title: record.title ?? null,
      projectId: record.projectId ?? null,
    };
  }

  private mapProject(record: any): Project {
    return {
      id: record.id,
      name: record.name,
      description: record.description ?? null,
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : String(record.createdAt),
    };
  }

  public saveItemToFolder(item: ClipboardItem): void {
    try {
      const folderName = DatabaseService.getCategoryFolderName(item.contentType);
      const targetDir = path.join(this.storageDir, folderName);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      if (item.contentType === "image") {
        const match = item.content.match(/^data:image\/(\w+);base64,(.+)$/);
        if (match) {
          const ext = match[1] === "jpeg" ? "jpg" : match[1];
          const buffer = Buffer.from(match[2], "base64");
          const filePath = path.join(targetDir, `${item.id}.${ext}`);
          fs.writeFileSync(filePath, buffer);
        }
      } else if (item.contentType === "json") {
        const filePath = path.join(targetDir, `${item.id}.json`);
        try {
          const formatted = JSON.stringify(JSON.parse(item.content), null, 2);
          fs.writeFileSync(filePath, formatted, "utf-8");
        } catch {
          fs.writeFileSync(filePath, item.content, "utf-8");
        }
      } else {
        const filePath = path.join(targetDir, `${item.id}.txt`);
        fs.writeFileSync(filePath, item.content, "utf-8");
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to save item to folder:", err);
      }
    }
  }

  public removeItemFromFolder(id: string, contentType?: ClipboardContentType): void {
    try {
      const categories = contentType
        ? [DatabaseService.getCategoryFolderName(contentType)]
        : ["images", "urls", "videos", "text", "json", "emoji", "colors", "code"];

      for (const cat of categories) {
        const targetDir = path.join(this.storageDir, cat);
        if (!fs.existsSync(targetDir)) continue;

        const possibleExtensions = [".png", ".jpg", ".jpeg", ".txt", ".json", ""];
        for (const ext of possibleExtensions) {
          const filePath = path.join(targetDir, `${id}${ext}`);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch {}
          }
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to remove item from folder:", err);
      }
    }
  }

  public async cleanupExpiredItems(days: number = this.maxRetentionDays): Promise<{ deletedCount: number }> {
    if (!this.prisma) await this.initialize();

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const expiredItems = await this.prisma!.clipboardItem.findMany({
      where: {
        isPinned: false,
        createdAt: {
          lt: cutoffDate,
        },
      },
      select: {
        id: true,
        contentType: true,
      },
    });

    if (expiredItems.length === 0) {
      return { deletedCount: 0 };
    }

    for (const item of expiredItems) {
      this.removeItemFromFolder(item.id, item.contentType as ClipboardContentType);
    }

    const result = await this.prisma!.clipboardItem.deleteMany({
      where: {
        id: { in: expiredItems.map((i) => i.id) },
      },
    });

    return { deletedCount: result.count };
  }

  public async addItem(data: {
    content: string;
    contentType: ClipboardContentType;
    isPinned?: boolean;
    title?: string | null;
    projectId?: string | null;
  }): Promise<ClipboardItem> {
    if (!this.prisma) await this.initialize();

    // Check if the exact same content exists recently
    const existing = await this.prisma!.clipboardItem.findFirst({
      where: { content: data.content },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      // Bring item to top by updating createdAt and updatedAt
      const updated = await this.prisma!.clipboardItem.update({
        where: { id: existing.id },
        data: {
          createdAt: new Date(),
          updatedAt: new Date(),
          title: data.title ?? existing.title,
        },
      });
      const mapped = this.mapItem(updated);
      this.saveItemToFolder(mapped);
      return mapped;
    }

    const created = await this.prisma!.clipboardItem.create({
      data: {
        content: data.content,
        contentType: data.contentType,
        isPinned: data.isPinned ?? false,
        title: data.title ?? null,
        projectId: data.projectId ?? null,
      },
    });

    const mapped = this.mapItem(created);
    this.saveItemToFolder(mapped);

    // Prune excess unpinned history if exceeding limit & purge expired items
    this.pruneHistory().catch(() => {});
    this.cleanupExpiredItems().catch(() => {});

    return mapped;
  }

  private async pruneHistory(): Promise<void> {
    if (!this.prisma) return;
    const totalCount = await this.prisma.clipboardItem.count({
      where: { isPinned: false },
    });
    if (totalCount > this.maxHistoryLimit) {
      const excess = totalCount - this.maxHistoryLimit;
      const oldest = await this.prisma.clipboardItem.findMany({
        where: { isPinned: false },
        orderBy: { createdAt: "asc" },
        take: excess,
        select: { id: true, contentType: true },
      });
      if (oldest.length > 0) {
        for (const item of oldest) {
          this.removeItemFromFolder(item.id, item.contentType as ClipboardContentType);
        }
        await this.prisma.clipboardItem.deleteMany({
          where: { id: { in: oldest.map((i) => i.id) } },
        });
      }
    }
  }

  public async getItems(query?: ClipboardQuery): Promise<ClipboardItem[]> {
    if (!this.prisma) await this.initialize();

    const where: any = {};

    if (query?.contentType && query.contentType !== "all") {
      where.contentType = query.contentType;
    }

    if (query?.pinnedOnly) {
      where.isPinned = true;
    }

    if (query?.projectId !== undefined) {
      where.projectId = query.projectId;
    }

    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { content: { contains: term } },
        { title: { contains: term } },
      ];
    }

    const sortOrder = query?.sort === "oldest" ? "asc" : "desc";

    const items = await this.prisma!.clipboardItem.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { createdAt: sortOrder },
      ],
    });

    return items.map((i) => this.mapItem(i));
  }

  public async getItemById(id: string): Promise<ClipboardItem | null> {
    if (!this.prisma) await this.initialize();
    const item = await this.prisma!.clipboardItem.findUnique({
      where: { id },
    });
    return item ? this.mapItem(item) : null;
  }

  public async pinItem(id: string, isPinned: boolean): Promise<ClipboardItem> {
    if (!this.prisma) await this.initialize();
    const updated = await this.prisma!.clipboardItem.update({
      where: { id },
      data: { isPinned, updatedAt: new Date() },
    });
    return this.mapItem(updated);
  }

  public async deleteItem(id: string): Promise<{ success: boolean }> {
    if (!this.prisma) await this.initialize();
    const item = await this.prisma!.clipboardItem.findUnique({
      where: { id },
      select: { contentType: true },
    });
    if (item) {
      this.removeItemFromFolder(id, item.contentType as ClipboardContentType);
    }
    await this.prisma!.clipboardItem.delete({
      where: { id },
    });
    return { success: true };
  }

  public async clearHistory(): Promise<{ deletedCount: number }> {
    if (!this.prisma) await this.initialize();
    const unpinnedItems = await this.prisma!.clipboardItem.findMany({
      where: { isPinned: false },
      select: { id: true, contentType: true },
    });
    for (const item of unpinnedItems) {
      this.removeItemFromFolder(item.id, item.contentType as ClipboardContentType);
    }
    // Preserve pinned items so users do not lose their saved favorites
    const result = await this.prisma!.clipboardItem.deleteMany({
      where: { isPinned: false },
    });
    return { deletedCount: result.count };
  }

  public async getProjects(): Promise<Project[]> {
    if (!this.prisma) await this.initialize();
    const projects = await this.prisma!.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return projects.map((p) => this.mapProject(p));
  }

  public async createProject(input: { name: string; description?: string }): Promise<Project> {
    if (!this.prisma) await this.initialize();
    const project = await this.prisma!.project.create({
      data: {
        name: input.name,
        description: input.description ?? null,
      },
    });
    return this.mapProject(project);
  }

  public async assignProject(itemId: string, projectId: string | null): Promise<ClipboardItem> {
    if (!this.prisma) await this.initialize();
    const updated = await this.prisma!.clipboardItem.update({
      where: { id: itemId },
      data: { projectId, updatedAt: new Date() },
    });
    return this.mapItem(updated);
  }

  public getSettings(): { allowedContentTypes: ClipboardContentType[] } {
    const settingsPath = path.join(path.dirname(this.dbPath), "settings.json");
    try {
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.allowedContentTypes)) {
          return {
            allowedContentTypes: parsed.allowedContentTypes,
          };
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to read settings.json:", err);
      }
    }
    return {
      allowedContentTypes: [
        "text",
        "code",
        "url",
        "color",
        "image",
        "video",
        "json",
        "emoji",
      ],
    };
  }

  public saveSettings(updates: { allowedContentTypes?: ClipboardContentType[] }): { allowedContentTypes: ClipboardContentType[] } {
    const current = this.getSettings();
    const updated = {
      ...current,
      ...updates,
    };
    const settingsPath = path.join(path.dirname(this.dbPath), "settings.json");
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2), "utf-8");
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to write settings.json:", err);
      }
    }
    return updated;
  }
}
