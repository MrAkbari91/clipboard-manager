import React, { useEffect, useState, useCallback } from "react";
import { ClipboardItem, ClipboardContentType, Project } from "./shared/clipboard-contract";

const CATEGORIES: Array<{ id: ClipboardContentType | "all"; label: string; icon: string }> = [
  { id: "all", label: "All Items", icon: "📁" },
  { id: "image", label: "Images", icon: "🖼️" },
  { id: "url", label: "URLs", icon: "🔗" },
  { id: "video", label: "Videos", icon: "🎬" },
  { id: "text", label: "Text", icon: "📝" },
  { id: "json", label: "JSON", icon: "📦" },
  { id: "emoji", label: "Emoji", icon: "😀" },
  { id: "color", label: "Colors", icon: "🎨" },
  { id: "code", label: "Code", icon: "💻" },
];

export default function App() {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [contentType, setContentType] = useState<ClipboardContentType | "all">("all");
  const [pinnedOnly, setPinnedOnly] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hasNodeAccess, setHasNodeAccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const refreshItems = useCallback(async () => {
    if (!window.clipboardBrain) return;
    try {
      const result = await window.clipboardBrain.getItems({
        search: search.trim() || undefined,
        contentType,
        pinnedOnly: pinnedOnly || undefined,
        projectId: selectedProjectId,
        sort: "newest",
      });
      setItems(result);
    } catch (err: any) {
      setStatusMessage(`Error fetching items: ${err.message}`);
    }
  }, [search, contentType, pinnedOnly, selectedProjectId]);

  const refreshProjects = useCallback(async () => {
    if (!window.clipboardBrain) return;
    try {
      const projList = await window.clipboardBrain.getProjects();
      setProjects(projList);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const nodePresent = typeof process !== "undefined" && Boolean(process.versions?.node);
    setHasNodeAccess(nodePresent);

    if (window.clipboardBrain) {
      window.clipboardBrain.getCaptureStatus().then((res) => setIsPaused(res.isPaused));
      refreshItems();
      refreshProjects();

      const unsubscribe = window.clipboardBrain.onItemAdded((newItem) => {
        setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [refreshItems, refreshProjects]);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  const togglePause = async () => {
    if (!window.clipboardBrain) return;
    const res = await window.clipboardBrain.setCapturePaused(!isPaused);
    setIsPaused(res.isPaused);
    setStatusMessage(res.isPaused ? "Capture paused" : "Capture active");
  };

  const handleCopy = async (id: string) => {
    if (!window.clipboardBrain) return;
    await window.clipboardBrain.copyItem(id);
    setStatusMessage("Copied to system clipboard in native format!");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  const handlePin = async (id: string, currentPinned: boolean) => {
    if (!window.clipboardBrain) return;
    const updated = await window.clipboardBrain.pinItem(id, !currentPinned);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  const handleDelete = async (id: string) => {
    if (!window.clipboardBrain) return;
    await window.clipboardBrain.deleteItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClear = async () => {
    if (!window.clipboardBrain) return;
    const res = await window.clipboardBrain.clearHistory();
    setStatusMessage(`Cleared ${res.deletedCount} items (pinned items preserved)`);
    refreshItems();
  };

  const handleOpenFolder = async () => {
    if (!window.clipboardBrain?.openStorageFolder) return;
    const res = await window.clipboardBrain.openStorageFolder(contentType === "all" ? undefined : contentType);
    setStatusMessage(`Opened storage folder: ${res.path}`);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const renderContent = (item: ClipboardItem) => {
    switch (item.contentType) {
      case "image":
        return (
          <div style={{ marginTop: "6px" }}>
            <img
              src={item.content}
              alt="Clipboard capture"
              style={{
                maxWidth: "100%",
                maxHeight: "180px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                objectFit: "contain",
                backgroundColor: "#f8fafc",
              }}
            />
          </div>
        );

      case "color":
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                backgroundColor: item.content,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                border: "2px solid #ffffff",
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", fontFamily: "Consolas, monospace" }}>
                {item.content}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Color code format</div>
            </div>
          </div>
        );

      case "emoji":
        return (
          <div style={{ fontSize: "28px", padding: "4px 0", letterSpacing: "4px" }}>
            {item.content}
          </div>
        );

      case "json":
        return (
          <pre
            style={{
              margin: "6px 0 0 0",
              fontSize: "12px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "Consolas, monospace",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#0369a1",
              padding: "10px",
              borderRadius: "6px",
              maxHeight: "140px",
              overflowY: "auto",
            }}
          >
            {(() => {
              try {
                return JSON.stringify(JSON.parse(item.content), null, 2);
              } catch {
                return item.content;
              }
            })()}
          </pre>
        );

      case "video":
        return (
          <div style={{ marginTop: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b91c1c", fontWeight: 600 }}>
              <span>🎬 Video URL / Source:</span>
            </div>
            <a
              href={item.content}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#2563eb", wordBreak: "break-all", fontSize: "13px" }}
            >
              {item.content}
            </a>
          </div>
        );

      case "url":
        return (
          <div style={{ marginTop: "6px" }}>
            <a
              href={item.content}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#2563eb", wordBreak: "break-all", fontSize: "13px", textDecoration: "underline" }}
            >
              {item.content}
            </a>
          </div>
        );

      case "code":
        return (
          <pre
            style={{
              margin: "6px 0 0 0",
              fontSize: "12px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "Consolas, monospace",
              backgroundColor: "#0f172a",
              color: "#f8fafc",
              padding: "10px",
              borderRadius: "6px",
              maxHeight: "140px",
              overflowY: "auto",
            }}
          >
            {item.content}
          </pre>
        );

      default:
        return (
          <pre
            style={{
              margin: "6px 0 0 0",
              fontSize: "13px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "inherit",
              padding: 0,
              maxHeight: "120px",
              overflowY: "auto",
            }}
          >
            {item.content}
          </pre>
        );
    }
  };

  const getBadgeStyle = (type: ClipboardContentType) => {
    switch (type) {
      case "image":
        return { bg: "#e0f2fe", text: "#0369a1", label: "🖼️ IMAGE" };
      case "color":
        return { bg: "#fce7f3", text: "#be185d", label: "🎨 COLOR" };
      case "video":
        return { bg: "#fee2e2", text: "#b91c1c", label: "🎬 VIDEO" };
      case "json":
        return { bg: "#fef3c7", text: "#b45309", label: "📦 JSON" };
      case "emoji":
        return { bg: "#fef9c3", text: "#854d0e", label: "😀 EMOJI" };
      case "url":
        return { bg: "#ecfdf5", text: "#047857", label: "🔗 URL" };
      case "code":
        return { bg: "#f3e8ff", text: "#7e22ce", label: "💻 CODE" };
      default:
        return { bg: "#f1f5f9", text: "#475569", label: "📝 TEXT" };
    }
  };

  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif", padding: "20px", maxWidth: "980px", margin: "0 auto", color: "#1e293b" }}>
      {/* Top Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", color: "#0f172a" }}>🧠 Clipboard Brain</h1>
          <div style={{ fontSize: "12px", color: hasNodeAccess ? "#dc2626" : "#16a34a", marginTop: "4px" }}>
            Security: {hasNodeAccess ? "⚠️ Warning: Node.js exposed!" : "🔒 Context Isolated (Node.js protected)"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleOpenFolder}
            style={{
              padding: "8px 12px",
              backgroundColor: "#0284c7",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📂 Open Storage Folder
          </button>
          <button
            onClick={togglePause}
            style={{
              padding: "8px 14px",
              backgroundColor: isPaused ? "#f59e0b" : "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {isPaused ? "▶ Resume Capture" : "⏸ Pause Capture"}
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: "8px 14px",
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🗑 Clear History
          </button>
        </div>
      </header>

      {statusMessage && (
        <div style={{ padding: "8px 12px", backgroundColor: "#f1f5f9", borderRadius: "6px", marginBottom: "12px", fontSize: "13px", borderLeft: "4px solid #3b82f6" }}>
          {statusMessage}
        </div>
      )}

      {/* Category Folders Bar */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "14px" }}>
        {CATEGORIES.map((cat) => {
          const active = contentType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setContentType(cat.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "20px",
                border: active ? "2px solid #2563eb" : "1px solid #cbd5e1",
                backgroundColor: active ? "#eff6ff" : "#ffffff",
                color: active ? "#1d4ed8" : "#475569",
                fontWeight: active ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Project Filter Bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Search across clips..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "220px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />
        <select
          value={selectedProjectId || ""}
          onChange={(e) => setSelectedProjectId(e.target.value ? e.target.value : null)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="">📁 All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              📁 {p.name}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={pinnedOnly}
            onChange={(e) => setPinnedOnly(e.target.checked)}
          />
          ⭐ Pinned Only
        </label>
      </div>

      {/* Items List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#94a3b8", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
            No items in <strong>{contentType.toUpperCase()}</strong> folder yet. Copy some {contentType === "all" ? "images, colors, urls, code or text" : contentType} to see it here!
          </div>
        ) : (
          items.map((item) => {
            const badge = getBadgeStyle(item.contentType);
            return (
              <div
                key={item.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "14px",
                  backgroundColor: item.isPinned ? "#fefce8" : "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        backgroundColor: badge.bg,
                        color: badge.text,
                      }}
                    >
                      {badge.label}
                    </span>
                    {item.title && <span style={{ fontWeight: 600, fontSize: "14px" }}>{item.title}</span>}
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleCopy(item.id)}
                      style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => handlePin(item.id, item.isPinned)}
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: item.isPinned ? "#fde047" : "#fff",
                      }}
                    >
                      {item.isPinned ? "★ Pinned" : "☆ Pin"}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ padding: "4px 8px", fontSize: "12px", cursor: "pointer", borderRadius: "4px", border: "1px solid #fca5a5", backgroundColor: "#fff", color: "#dc2626" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {renderContent(item)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
