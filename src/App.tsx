import React, { useEffect, useState, useCallback } from "react";
import { ClipboardItem, ClipboardContentType, Project } from "./shared/clipboard-contract";

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
    // Check security isolation (renderer MUST NOT have direct Node.js access)
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
    setStatusMessage("Copied to system clipboard!");
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
    setStatusMessage(`Cleared ${res.deletedCount} items`);
    refreshItems();
  };

  return (
    <div style={{ fontFamily: "Segoe UI, sans-serif", padding: "20px", maxWidth: "900px", margin: "0 auto", color: "#1e293b" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", color: "#0f172a" }}>🧠 Clipboard Brain</h1>
          <div style={{ fontSize: "12px", color: hasNodeAccess ? "#dc2626" : "#16a34a", marginTop: "4px" }}>
            Security: {hasNodeAccess ? "⚠️ Warning: Node.js exposed!" : "🔒 Context Isolated (Node.js protected)"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
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
        <div style={{ padding: "8px 12px", backgroundColor: "#f1f5f9", borderRadius: "6px", marginBottom: "12px", fontSize: "13px" }}>
          {statusMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Search clipboard content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value as any)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="all">All Types</option>
          <option value="text">Plain Text</option>
          <option value="code">Code</option>
          <option value="url">URL</option>
          <option value="color">Color</option>
        </select>
        <select
          value={selectedProjectId || ""}
          onChange={(e) => setSelectedProjectId(e.target.value ? e.target.value : null)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="">All Projects</option>
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

      {/* Item List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            No clipboard items yet. Copy some text, URL, code, or hex color to test!
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "12px",
                backgroundColor: item.isPinned ? "#fefce8" : "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor:
                        item.contentType === "code"
                          ? "#ede9fe"
                          : item.contentType === "url"
                          ? "#e0f2fe"
                          : item.contentType === "color"
                          ? "#fce7f3"
                          : "#f1f5f9",
                      color:
                        item.contentType === "code"
                          ? "#6b21a8"
                          : item.contentType === "url"
                          ? "#0369a1"
                          : item.contentType === "color"
                          ? "#be185d"
                          : "#475569",
                    }}
                  >
                    {item.contentType}
                  </span>
                  {item.title && <span style={{ fontWeight: 600, fontSize: "14px" }}>{item.title}</span>}
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleCopy(item.id)}
                    style={{ padding: "4px 8px", fontSize: "12px", cursor: "pointer", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => handlePin(item.id, item.isPinned)}
                    style={{
                      padding: "4px 8px",
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
              <pre
                style={{
                  margin: 0,
                  fontSize: "13px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: item.contentType === "code" ? "Consolas, monospace" : "inherit",
                  backgroundColor: item.contentType === "code" ? "#f8fafc" : "transparent",
                  padding: item.contentType === "code" ? "8px" : 0,
                  borderRadius: "4px",
                  maxHeight: "120px",
                  overflowY: "auto",
                }}
              >
                {item.content}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
