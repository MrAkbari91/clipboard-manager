import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerIpcHandlers, unregisterIpcHandlers } from "../ipc/handlers";
import { IPC_CHANNELS } from "../ipc/channels";
import { DatabaseService } from "../db/database";
import { ClipboardMonitor } from "../clipboard-monitor";

const mocks = vi.hoisted(() => ({
  handlers: new Map<string, (...args: any[]) => any>(),
  writeImage: vi.fn(), writeText: vi.fn(), fromDataURL: vi.fn(),
  openPath: vi.fn().mockResolvedValue(""), removeHandler: vi.fn(),
}));
vi.mock("electron", () => ({
  ipcMain: {
    handle: (channel: string, callback: (...args: any[]) => any) => mocks.handlers.set(channel, callback),
    removeHandler: mocks.removeHandler,
  },
  clipboard: { writeImage: mocks.writeImage, writeText: mocks.writeText },
  nativeImage: { createFromDataURL: mocks.fromDataURL },
  shell: { openPath: mocks.openPath },
}));

describe("Merged native clipboard API", () => {
  const getItemById = vi.fn();
  const getStorageDirectory = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.handlers.clear();
    registerIpcHandlers({
      db: { getItemById, getStorageDirectory } as unknown as DatabaseService,
      monitor: {} as ClipboardMonitor,
      getMainWindow: () => null,
    });
  });

  it("copies captured images as native images rather than base64 text", async () => {
    const nativeImage = { native: true };
    getItemById.mockResolvedValue({ contentType: "image", content: "data:image/png;base64,test" });
    mocks.fromDataURL.mockReturnValue(nativeImage);
    expect(await mocks.handlers.get(IPC_CHANNELS.COPY_ITEM)!({}, "image-1")).toEqual({ success: true });
    expect(mocks.writeImage).toHaveBeenCalledWith(nativeImage);
    expect(mocks.writeText).not.toHaveBeenCalled();
  });

  it.each(["text", "code", "url", "color", "video", "json", "emoji"])("preserves %s content when copying", async (contentType) => {
    getItemById.mockResolvedValue({ contentType, content: "original content" });
    await mocks.handlers.get(IPC_CHANNELS.COPY_ITEM)!({}, "clip-1");
    expect(mocks.writeText).toHaveBeenCalledWith("original content");
    expect(mocks.writeImage).not.toHaveBeenCalled();
  });

  it("opens the selected category through the existing storage API", async () => {
    getStorageDirectory.mockReturnValue("test-storage/images");
    const result = await mocks.handlers.get(IPC_CHANNELS.OPEN_STORAGE_FOLDER)!({}, "image");
    expect(getStorageDirectory).toHaveBeenCalledWith("image");
    expect(mocks.openPath).toHaveBeenCalledWith("test-storage/images");
    expect(result).toEqual({ success: true, path: "test-storage/images" });
  });

  it("unregisters the storage handler together with the other IPC handlers", () => {
    unregisterIpcHandlers();
    expect(mocks.removeHandler).toHaveBeenCalledWith(IPC_CHANNELS.OPEN_STORAGE_FOLDER);
  });
});
