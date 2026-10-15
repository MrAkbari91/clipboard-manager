import { Icon } from "../ui/Icon";
import React, { useState } from "react";
import { ClipboardItem, Project } from "../../shared/clipboard-contract";
import { Dialog } from "../ui/Dialog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { hasRichPreview, RichContentPreview } from "./RichContentPreview";

export interface PreviewModalProps {
  item: ClipboardItem | null;
  projects: Project[];
  onClose: () => void;
  onCopy: (id: string) => Promise<boolean>;
  onPin: (id: string, isPinned: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAssignProject: (itemId: string, projectId: string | null) => Promise<boolean>;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
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

  const handleCopy = async () => {
    const ok = await onCopy(item.id);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePin = async () => {
    await onPin(item.id, !item.isPinned);
  };

  const handleDelete = async () => {
    if (await onDelete(item.id)) onClose();
  };

  return (
    <Dialog
      isOpen={Boolean(item)}
      onClose={onClose}
      title={item.title || `${item.contentType.toUpperCase()} Preview`}
      description={`Captured on ${new Date(item.createdAt).toLocaleString()}`}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <Button variant="danger" size="sm" onClick={handleDelete} icon={<Icon name="trash" size={15} />}>
            Delete
          </Button>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="secondary" onClick={handlePin}>
              {item.isPinned ? "★ Unpin" : "☆ Pin"}
            </Button>
            <Button variant="primary" onClick={handleCopy}>
              {copied ? "✓ Copied to Clipboard" : "Copy content"}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Meta Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <Badge type={item.contentType} />
          {item.isPinned && <Badge type="pinned" label="Pinned" />}
          <span className="text-small">
            {charCount} characters • {wordCount} words • {lineCount} lines
          </span>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
            <label htmlFor="preview-project-select" className="text-small" style={{ color: "var(--text-muted)" }}>
              Project:
            </label>
            <select
              id="preview-project-select"
              className="select-field"
              value={item.projectId || ""}
              onChange={(e) => onAssignProject(item.id, e.target.value ? e.target.value : null)}
              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
            >
              <option value="">No Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Color preview if applicable */}
        {item.contentType === "color" && (
          <div
            style={{
              height: "60px",
              borderRadius: "var(--radius-md)",
              backgroundColor: item.content,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <span
              style={{
                background: "rgba(0,0,0,0.6)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                color: "#ffffff",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
              }}
            >
              {item.content}
            </span>
          </div>
        )}

        {/* Content Box */}
        {hasRichPreview(item) ? <RichContentPreview item={item} /> : <pre
          style={{
            fontFamily: item.contentType === "code" ? "var(--font-mono)" : "inherit",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            maxHeight: "340px",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: "0.875rem",
            color: item.contentType === "code" ? "var(--text-code)" : "var(--text-primary)",
            lineHeight: 1.6,
          }}
        >
          {item.content}
        </pre>}
      </div>
    </Dialog>
  );
};
