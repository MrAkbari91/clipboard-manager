import React from "react";

export type ActiveNavPage = "all" | "pinned" | "projects" | "settings";

export interface SidebarProps {
  activePage: ActiveNavPage;
  onNavigate: (page: ActiveNavPage) => void;
  allCount: number;
  pinnedCount: number;
  projectsCount: number;
  isPaused: boolean;
  isNativeElectron: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  allCount,
  pinnedCount,
  projectsCount,
  isPaused,
  isNativeElectron,
}) => {
  return (
    <aside className="sidebar">
      <div>
        {/* Brand header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 8px", marginBottom: "16px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: 700,
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
              flexShrink: 0,
            }}
          >
            🧠
          </div>
          <div className="brand-title">
            <h1 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: "1.2" }}>
              Clipboard Brain
            </h1>
            <span style={{ fontSize: "0.6875rem", color: isNativeElectron ? "var(--accent-emerald)" : "var(--accent-cyan)", fontWeight: 500 }}>
              {isNativeElectron ? "● Desktop Native" : "● Browser Sandbox"}
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <button
            type="button"
            className={`nav-item ${activePage === "all" ? "active" : ""}`}
            onClick={() => onNavigate("all")}
          >
            <span style={{ fontSize: "1rem" }} aria-hidden="true">📋</span>
            <span className="nav-label">All Items</span>
            {allCount > 0 && <span className="nav-badge">{allCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "pinned" ? "active" : ""}`}
            onClick={() => onNavigate("pinned")}
          >
            <span style={{ fontSize: "1rem", color: "var(--accent-amber)" }} aria-hidden="true">★</span>
            <span className="nav-label">Pinned</span>
            {pinnedCount > 0 && <span className="nav-badge">{pinnedCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "projects" ? "active" : ""}`}
            onClick={() => onNavigate("projects")}
          >
            <span style={{ fontSize: "1rem" }} aria-hidden="true">📁</span>
            <span className="nav-label">Projects</span>
            {projectsCount > 0 && <span className="nav-badge">{projectsCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "settings" ? "active" : ""}`}
            onClick={() => onNavigate("settings")}
          >
            <span style={{ fontSize: "1rem" }} aria-hidden="true">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>
      </div>

      {/* Footer Status Panel */}
      <div className="status-panel" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "10px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Capture status:</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.6875rem",
              fontWeight: 600,
              backgroundColor: isPaused ? "var(--accent-amber-subtle)" : "var(--accent-emerald-subtle)",
              color: isPaused ? "var(--accent-amber)" : "var(--accent-emerald)",
            }}
          >
            {isPaused ? "Paused" : "Active"}
          </span>
        </div>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
          🔒 Context Isolated • SQLite Local
        </div>
      </div>
    </aside>
  );
};
