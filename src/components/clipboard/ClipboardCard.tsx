import React, { useState } from "react";
import { ClipboardItem, Project } from "../../shared/clipboard-contract";
import { Button } from "../ui/Button";

export interface ClipboardCardProps {
  item: ClipboardItem;
  projects: Project[];
  isSelected?: boolean;
  onSelect?: (item: ClipboardItem) => void;
  onCopy: (id: string) => Promise<boolean>;
  onPin: (id: string, isPinned: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAssignProject: (itemId: string, projectId: string | null) => Promise<boolean>;
  onOpenPreview: (item: ClipboardItem) => void;
}

export const ClipboardCard: React.FC<ClipboardCardProps> = ({
  item,
  projects,
  isSelected = false,
  onSelect,
  onCopy,
  onPin,
  onDelete,
  onAssignProject,
  onOpenPreview,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const assignedProject = projects.find((p) => p.id === item.projectId);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await onCopy(item.id);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onPin(item.id, !item.isPinned);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    await onDelete(item.id);
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHour = Math.floor(diffMin / 60);

      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getTypeIcon = () => {
    switch (item.contentType) {
      case "code":
        return "</>";
      case "url":
        return "↗";
      case "color":
        return "✦";
      default:
        return "¶";
    }
  };

  const lines = item.content.split("\n");
  const lineCount = lines.length;
  const charCount = item.content.length;

  return (
    <article
      className={`clipboard-card ${item.isPinned ? "pinned" : ""} ${isSelected ? "active-selected" : ""}`}
      onClick={() => {
        if (onSelect) onSelect(item);
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenPreview(item);
        }
      }}
      aria-label={`Clipboard item: ${item.title || item.contentType}`}
    >
      {/* Top Header Row */}
      <div className="card-top-row">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className={`card-type-icon-box ${item.contentType}`}>
            {getTypeIcon()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)",
                }}
              >
                {item.contentType}
              </span>
              {item.isPinned && (
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: "var(--radius-full)",
                    backgroundColor: "var(--accent-amber-subtle)",
                    color: "var(--accent-amber)",
                  }}
                >
                  ★ Pinned
                </span>
              )}
            </div>
            {item.title && (
              <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "1px" }}>
                {item.title}
              </h4>
            )}
          </div>
        </div>

        {/* Floating Quick Action Toolbar */}
        <div className="card-quick-actions" onClick={(e) => e.stopPropagation()}>
          <Button
            variant={copied ? "primary" : "secondary"}
            size="sm"
            onClick={handleCopy}
            title="Copy to clipboard (Instant)"
            aria-label="Copy to system clipboard"
          >
            {copied ? "✓ Copied" : "Copy"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePin}
            title={item.isPinned ? "Unpin item" : "Pin item to favorites"}
            style={{ color: item.isPinned ? "var(--accent-amber)" : "var(--text-muted)" }}
          >
            {item.isPinned ? "★" : "☆"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenPreview(item)}
            title="Open detailed preview"
          >
            👁️
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
            title="Delete from history"
            style={{ color: "var(--accent-rose)" }}
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Content Visualization Body */}
      {item.contentType === "code" ? (
        <div className="code-container-preview">
          <div className="code-window-header">
            <span className="code-window-dot red" />
            <span className="code-window-dot yellow" />
            <span className="code-window-dot green" />
            <span style={{ fontSize: "0.6875rem", marginLeft: "auto", color: "var(--text-muted)" }}>
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          </div>
          <div
            style={{
              maxHeight: "100px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "pre-wrap",
            }}
          >
            {item.content}
          </div>
        </div>
      ) : item.contentType === "color" ? (
        <div className="color-card-preview">
          <div
            className="large-color-swatch"
            style={{ backgroundColor: item.content }}
          />
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
              {item.content}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Color snippet • Click copy to capture HEX
            </div>
          </div>
        </div>
      ) : item.contentType === "url" ? (
        <div className="url-card-preview" onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: "1.1rem" }}>🔗</span>
          <a
            href={item.content}
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {item.content}
          </a>
        </div>
      ) : (
        <p className="card-body-preview">{item.content}</p>
      )}

      {/* Bottom Metadata & Project Assign Row */}
      <div className="card-bottom-row" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{formatTimestamp(item.createdAt)}</span>
          <span>•</span>
          <span>{charCount} chars</span>
        </div>

        {/* Project Selector Chip */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <select
            className="select-field"
            value={item.projectId || ""}
            onChange={(e) => {
              const val = e.target.value ? e.target.value : null;
              onAssignProject(item.id, val);
            }}
            style={{
              padding: "2px 8px",
              fontSize: "0.6875rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: assignedProject ? "var(--accent-indigo-subtle)" : "var(--bg-surface-elevated)",
              color: assignedProject ? "var(--accent-indigo)" : "var(--text-muted)",
              fontWeight: assignedProject ? 600 : 400,
            }}
          >
            <option value="">📁 No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </article>
  );
};
