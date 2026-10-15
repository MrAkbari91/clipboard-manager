import React, { useState } from "react";
import { Icon } from "../components/ui/Icon";
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
  const [view, setView] = useState<"grid" | "list">("grid");
  const isFiltered = Boolean(
    query.search ||
      (query.contentType && query.contentType !== "all") ||
      query.pinnedOnly ||
      query.sort !== "newest"
  );

  return (
    <div className="all-items-page">
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

      <div className="collection-toolbar">
        <div><strong>{isFiltered ? "Search results" : "Your collection"}</strong><span>{items.length} {items.length === 1 ? "clip" : "clips"}</span></div>
        <div className="view-switch" aria-label="Collection layout">
          <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"}><Icon name="grid" size={16} /></button>
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"}><Icon name="list" size={17} /></button>
        </div>
      </div>

      {loading ? (
        <div className="clips-grid" role="status" aria-label="Loading clipboard history">{[1, 2, 3, 4].map(n => <div key={n} className="skeleton-card"><span /><span /><span /></div>)}</div>
      ) : items.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={<Icon name="search" size={30} />}
            title="No matching clipboard items"
            description="No items match your active search keyword or filter settings. Try clearing your filters."
            actionLabel="Reset all filters"
            onAction={onResetFilters}
          />
        ) : (
          <EmptyState
            icon={<Icon name="clipboard" size={30} />}
            title="Your next great idea starts with a copy."
            description="Copy text, a link, some code, or a color in the desktop app. Your clips will be right here when you need them."
          />
        )
      ) : (
        <div className={`clips-grid ${view === "list" ? "list-view" : ""}`}>
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
