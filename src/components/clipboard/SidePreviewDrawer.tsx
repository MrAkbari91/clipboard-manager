import { Icon } from "../ui/Icon";
import React, { useState } from "react";
import { ClipboardItem, Project } from "../../shared/clipboard-contract";
import { Button } from "../ui/Button";

export interface SidePreviewDrawerProps {
  item: ClipboardItem | null;
  projects: Project[];
  onClose: () => void;
  onCopy: (id: string) => Promise<boolean>;
  onPin: (id: string, isPinned: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAssignProject: (itemId: string, projectId: string | null) => Promise<boolean>;
}

export const SidePreviewDrawer: React.FC<SidePreviewDrawerProps> = ({
  item,
  projects,
  onClose,
  onCopy,
  onPin,
  onDelete,
  onAssignProject,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!item) return null;

  const charCount = item.content.length;
  const wordCount = item.content.trim().split(/\s+/).filter(Boolean).length;
  const lineCount = item.content.split("\n").length;
  const assignedProject = projects.find((p) => p.id === item.projectId);

  const handleCopy = async () => {
    const ok = await onCopy(item.id);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside className="side-preview-drawer" aria-label="Item preview inspector">
      {/* Drawer Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.1rem" }}>
            <Icon name={item.contentType} />
          </span>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Inspector</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close inspector">
          ✕
        </Button>
      </div>

      {/* Drawer Body */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Quick Actions Bar */}
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="primary" style={{ flex: 1 }} onClick={handleCopy}>
            {copied ? "✓ Copied" : "Copy content"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onPin(item.id, !item.isPinned)}
            style={{ color: item.isPinned ? "var(--accent-amber)" : "inherit" }}
          >
            {item.isPinned ? "★ Unpin" : "☆ Pin"}
          </Button>
          <Button variant="ghost" aria-label="Delete item" onClick={() => onDelete(item.id)} style={{ color: "var(--accent-rose)" }}>
            <Icon name="trash" size={16} />
          </Button>
        </div>

        {/* Project Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
            Assigned Project
          </label>
          <select
            className="select-field" aria-label="Assigned project"
            value={item.projectId || ""}
            onChange={(e) => onAssignProject(item.id, e.target.value ? e.target.value : null)}
          >
            <option value="">No Project Assigned</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Color preview if applicable */}
        {item.contentType === "color" && (
          <div
            style={{
              height: "70px",
              borderRadius: "var(--radius-md)",
              backgroundColor: item.content,
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                background: "rgba(0,0,0,0.65)",
                color: "#ffffff",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "0.875rem",
              }}
            >
              {item.content}
            </span>
          </div>
        )}

        {/* Full Text / Code Container */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>
              Content Preview
            </span>
            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
              {charCount} chars • {wordCount} words • {lineCount} lines
            </span>
          </div>
          <pre
            style={{
              padding: "14px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              fontFamily: item.contentType === "code" ? "var(--font-mono)" : "var(--font-sans)",
              fontSize: "0.8125rem",
              lineHeight: 1.6,
              color: item.contentType === "code" ? "var(--text-code)" : "var(--text-primary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: "360px",
              overflowY: "auto",
            }}
          >
            {item.content}
          </pre>
        </div>

        {/* Metadata Details */}
        <div
          style={{
            padding: "12px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1px solid var(--border-subtle)",
            fontSize: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            color: "var(--text-secondary)",
          }}
        >
          <div>
            <strong>Captured:</strong> {new Date(item.createdAt).toLocaleString()}
          </div>
          <div>
            <strong>Type:</strong> <span style={{ textTransform: "uppercase" }}>{item.contentType}</span>
          </div>
          {assignedProject && (
            <div>
              <strong>Project:</strong> {assignedProject.name}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
