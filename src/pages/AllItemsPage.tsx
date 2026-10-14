import React from "react";
import { ClipboardItem, ClipboardQuery, Project } from "../shared/clipboard-contract";
import { FilterBar } from "../components/clipboard/FilterBar";
import { ClipboardCard } from "../components/clipboard/ClipboardCard";
import { EmptyState } from "../components/ui/EmptyState";

export interface AllItemsPageProps {
  items: ClipboardItem[];
  projects: Project[];
  loading: boolean;
  query: ClipboardQuery;
  selectedItemId?: string | null;
  onSelectCard: (item: ClipboardItem) => void;
  onUpdateContentType: (type: ClipboardQuery["contentType"]) => void;
  onUpdatePinnedOnly: (pinned: boolean) => void;
  onUpdateSort: (sort: "newest" | "oldest") => void;
  onResetFilters: () => void;
  onCopy: (id: string) => Promise<boolean>;
  onPin: (id: string, isPinned: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAssignProject: (itemId: string, projectId: string | null) => Promise<boolean>;
  onOpenPreview: (item: ClipboardItem) => void;
}

export const AllItemsPage: React.FC<AllItemsPageProps> = ({
  items,
  projects,
  loading,
  query,
  selectedItemId,
  onSelectCard,
  onUpdateContentType,
  onUpdatePinnedOnly,
  onUpdateSort,
  onResetFilters,
  onCopy,
  onPin,
  onDelete,
  onAssignProject,
  onOpenPreview,
}) => {
  const isFiltered = Boolean(
    query.search ||
      (query.contentType && query.contentType !== "all") ||
      query.pinnedOnly ||
      query.sort !== "newest"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <FilterBar
        selectedType={query.contentType || "all"}
        onSelectType={onUpdateContentType}
        pinnedOnly={Boolean(query.pinnedOnly)}
        onTogglePinnedOnly={onUpdatePinnedOnly}
        sort={query.sort || "newest"}
        onSortChange={onUpdateSort}
        onResetFilters={onResetFilters}
        isFiltered={isFiltered}
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          <p className="text-body">Loading clipboard history...</p>
        </div>
      ) : items.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon="🔍"
            title="No matching clipboard items"
            description="No items match your active search keyword or filter settings. Try clearing your filters."
            actionLabel="Reset all filters"
            onAction={onResetFilters}
          />
        ) : (
          <EmptyState
            icon="🧠"
            title="Clipboard Brain is waiting for copies"
            description="Copy any text, URL, code, or hex color anywhere on your OS. It will automatically appear here with instant search and organization."
          />
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {items.map((item) => (
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
      )}
    </div>
  );
};
