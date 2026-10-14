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
          <div style={{ fontSize: "2rem", marginBottom: "12px", animation: "spin 1s infinite linear" }}>
            ⏳
          </div>
          <p className="text-body">Loading clipboard items...</p>
        </div>
      ) : items.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon="🔍"
            title="No matching clipboard items"
            description="No items match your active filters or search keyword. Try clearing filters or searching for something else."
            actionLabel="Clear all filters"
            onAction={onResetFilters}
          />
        ) : (
          <EmptyState
            icon="📋"
            title="Clipboard is empty"
            description="Copy any text, link, code snippet, or color anywhere on your computer. Clipboard Brain will automatically capture and catalog it here."
          />
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((item) => (
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
      )}
    </div>
  );
};
