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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", marginBottom: "20px" }}>
          <span style={{ fontSize: "24px" }}>🧠</span>
          <div className="logo-text">
            <h1 style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc", lineHeight: "1.2" }}>
              Clipboard Brain
            </h1>
            <span style={{ fontSize: "11px", color: isNativeElectron ? "#10b981" : "#38bdf8" }}>
              {isNativeElectron ? "● Electron Desktop" : "● Browser Dev"}
            </span>
          </div>
        </div>

        {/* Navigation items (Strictly following roadmap: All Items, Pinned, Projects, Settings) */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <button
            type="button"
            className={`nav-item ${activePage === "all" ? "active" : ""}`}
            onClick={() => onNavigate("all")}
          >
            <span aria-hidden="true">📋</span>
            <span className="nav-label">All Items</span>
            {allCount > 0 && <span className="nav-badge">{allCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "pinned" ? "active" : ""}`}
            onClick={() => onNavigate("pinned")}
          >
            <span aria-hidden="true">⭐</span>
            <span className="nav-label">Pinned</span>
            {pinnedCount > 0 && <span className="nav-badge">{pinnedCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "projects" ? "active" : ""}`}
            onClick={() => onNavigate("projects")}
          >
            <span aria-hidden="true">📁</span>
            <span className="nav-label">Projects</span>
            {projectsCount > 0 && <span className="nav-badge">{projectsCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-item ${activePage === "settings" ? "active" : ""}`}
            onClick={() => onNavigate("settings")}
          >
            <span aria-hidden="true">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>
      </div>

      {/* Footer Status Indicators */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "10px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
          <span style={{ color: "var(--text-muted)" }}>Capture:</span>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: isPaused ? "var(--color-warning-bg)" : "var(--color-success-bg)",
              color: isPaused ? "var(--color-warning)" : "var(--color-success)",
            }}
          >
            {isPaused ? "Paused" : "Active"}
          </span>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          🔒 Context Isolated
        </div>
      </div>
    </aside>
  );
};
