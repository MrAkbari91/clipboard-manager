import React, { useState } from "react";
import { ClipboardItem, Project } from "../../shared/clipboard-contract";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export interface ClipboardCardProps {
  item: ClipboardItem;
  projects: Project[];
  onCopy: (id: string) => Promise<boolean>;
  onPin: (id: string, isPinned: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAssignProject: (itemId: string, projectId: string | null) => Promise<boolean>;
  onOpenPreview: (item: ClipboardItem) => void;
}

export const ClipboardCard: React.FC<ClipboardCardProps> = ({
  item,
  projects,
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

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  return (
    <article
      className={`clipboard-card ${item.isPinned ? "pinned" : ""}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenPreview(item);
        }
      }}
      aria-label={`Clipboard item: ${item.title || item.contentType}`}
    >
      <div className="card-header">
        <div className="card-meta">
          <Badge type={item.contentType} />
          {item.isPinned && <Badge type="pinned" label="Pinned" />}
          {assignedProject && (
            <span
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "rgba(99, 102, 241, 0.2)",
                color: "#a5b4fc",
                fontWeight: 600,
              }}
            >
              📁 {assignedProject.name}
            </span>
          )}
          {item.title && (
            <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
              {item.title}
            </span>
          )}
          <span className="text-small" style={{ marginLeft: "auto" }}>
            {formatDate(item.createdAt)}
          </span>
        </div>

        {/* Card Actions */}
        <div className="card-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Copy to clipboard"
            aria-label="Copy item to system clipboard"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePin}
            title={item.isPinned ? "Unpin item" : "Pin item"}
            aria-label={item.isPinned ? "Unpin item" : "Pin item"}
            style={{ color: item.isPinned ? "var(--color-warning)" : "inherit" }}
          >
            {item.isPinned ? "★ Unpin" : "☆ Pin"}
          </Button>

          {/* Project assign dropdown */}
          <select
            className="select-field"
            value={item.projectId || ""}
            onChange={(e) => {
              const val = e.target.value ? e.target.value : null;
              onAssignProject(item.id, val);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ padding: "3px 6px", fontSize: "0.75rem", maxWidth: "120px" }}
            aria-label="Assign to project"
          >
            <option value="">No Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.name}
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenPreview(item)}
            title="Preview full item"
            aria-label="Open detailed preview"
          >
            👁️
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
            title="Delete item"
            aria-label="Delete item from history"
            style={{ color: "var(--color-danger)" }}
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Content Rendering based on type */}
      <div
        className={`card-content-preview ${item.contentType === "code" ? "is-code" : ""}`}
        onClick={() => onOpenPreview(item)}
        style={{ cursor: "pointer" }}
      >
        {item.contentType === "color" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span className="color-swatch" style={{ backgroundColor: item.content }} />
            <code style={{ color: "var(--text-code)", fontWeight: 600 }}>{item.content}</code>
          </div>
        )}
        {item.contentType === "url" ? (
          <a
            href={item.content}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: "var(--type-url)", textDecoration: "underline" }}
          >
            {item.content}
          </a>
        ) : (
          item.content
        )}
      </div>
    </article>
  );
};
