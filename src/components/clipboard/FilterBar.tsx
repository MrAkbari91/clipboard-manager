import React from "react";
import { ClipboardContentType } from "../../shared/clipboard-contract";
import { Button } from "../ui/Button";

export interface FilterBarProps {
  selectedType: ClipboardContentType | "all";
  onSelectType: (type: ClipboardContentType | "all") => void;
  pinnedOnly: boolean;
  onTogglePinnedOnly: (pinned: boolean) => void;
  sort: "newest" | "oldest";
  onSortChange: (sort: "newest" | "oldest") => void;
  onResetFilters: () => void;
  isFiltered: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedType,
  onSelectType,
  pinnedOnly,
  onTogglePinnedOnly,
  sort,
  onSortChange,
  onResetFilters,
  isFiltered,
}) => {
  const types: Array<{ key: ClipboardContentType | "all"; label: string; icon: string }> = [
    { key: "all", label: "All", icon: "✨" },
    { key: "text", label: "Text", icon: "📄" },
    { key: "code", label: "Code", icon: "💻" },
    { key: "url", label: "URL", icon: "🔗" },
    { key: "color", label: "Color", icon: "🎨" },
  ];

  return (
    <div className="filter-bar">
      {/* Type Filter Buttons */}
      <div className="filter-group">
        {types.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`filter-btn ${selectedType === t.key ? "active" : ""}`}
            onClick={() => onSelectType(t.key)}
          >
            <span aria-hidden="true" style={{ marginRight: "4px" }}>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Pinned-only Filter */}
      <button
        type="button"
        className={`filter-btn ${pinnedOnly ? "active" : ""}`}
        style={{
          border: "1px solid var(--border-subtle)",
          padding: "5px 12px",
          borderRadius: "var(--radius-md)",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
        onClick={() => onTogglePinnedOnly(!pinnedOnly)}
      >
        <span>⭐</span>
        <span>Pinned only</span>
      </button>

      {/* Sort selection */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="text-small" style={{ color: "var(--text-muted)" }}>
          Sort:
        </span>
        <select
          className="select-field"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
          style={{ padding: "4px 8px", fontSize: "0.8125rem" }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            Reset filters
          </Button>
        )}
      </div>
    </div>
  );
};
