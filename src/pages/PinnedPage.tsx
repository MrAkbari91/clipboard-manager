import { Icon } from "../components/ui/Icon";
import React from "react";
import { ClipboardItem, Project } from "../shared/clipboard-contract";
import { ClipboardCard } from "../components/clipboard/ClipboardCard";
import { EmptyState } from "../components/ui/EmptyState";

export interface PinnedPageProps {
  items: ClipboardItem[];
  projects: Project[];
  loading: boolean;
  selectedItemId?: string | null;
  onSelectCard: (item: ClipboardItem) => void;
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
  selectedItemId,
  onSelectCard,
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
        icon={<Icon name="pin" size={30} />}
        title="No pinned snippets yet"
        description="Pin frequently used code, snippets, or links to access them with a single click."
        actionLabel="Browse All Items"
        onAction={onNavigateAll}
      />
    );
  }

  return (
    <div className="clips-grid">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px", gridColumn: "1 / -1" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>
          {pinnedItems.length} {pinnedItems.length === 1 ? "Favorite Snippet" : "Favorite Snippets"}
        </span>
      </div>

      {pinnedItems.map((item) => (
        <ClipboardCard
          key={item.id}
          item={item}
          projects={projects}
          isSelected={selectedItemId === item.id}
          onSelect={onSelectCard}
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
