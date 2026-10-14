import React from "react";
import { ClipboardItem, Project } from "../shared/clipboard-contract";
import { ClipboardCard } from "../components/clipboard/ClipboardCard";
import { EmptyState } from "../components/ui/EmptyState";

export interface PinnedPageProps {
  items: ClipboardItem[];
  projects: Project[];
  loading: boolean;
  onCopy: (id: string) => Promise<boolean>;
  onPin: (id: string, isPinned: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAssignProject: (itemId: string, projectId: string | null) => Promise<boolean>;
  onOpenPreview: (item: ClipboardItem) => void;
  onNavigateAll: () => void;
}

export const PinnedPage: React.FC<PinnedPageProps> = ({
  items,
  projects,
  loading,
  onCopy,
  onPin,
  onDelete,
  onAssignProject,
  onOpenPreview,
  onNavigateAll,
}) => {
  const pinnedItems = items.filter((i) => i.isPinned);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
        <p className="text-body">Loading pinned items...</p>
      </div>
    );
  }

  if (pinnedItems.length === 0) {
    return (
      <EmptyState
        icon="⭐"
        title="No pinned items yet"
        description="Pin important snippets, commands, credentials, or links to keep them permanently at your fingertips."
        actionLabel="Explore All Items"
        onAction={onNavigateAll}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <span className="text-body" style={{ fontWeight: 600 }}>
          {pinnedItems.length} {pinnedItems.length === 1 ? "pinned item" : "pinned items"}
        </span>
      </div>

      {pinnedItems.map((item) => (
        <ClipboardCard
          key={item.id}
          item={item}
          projects={projects}
          onCopy={onCopy}
          onPin={onPin}
          onDelete={onDelete}
          onAssignProject={onAssignProject}
          onOpenPreview={onOpenPreview}
        />
      ))}
    </div>
  );
};
