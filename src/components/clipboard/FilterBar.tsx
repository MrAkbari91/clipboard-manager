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
    { key: "all", label: "All Types", icon: "✨" },
    { key: "text", label: "Text", icon: "¶" },
    { key: "code", label: "Code", icon: "</>" },
    { key: "url", label: "Links", icon: "↗" },
    { key: "color", label: "Colors", icon: "✦" },
  ];

  return (
    <div className="filter-bar">
      {/* Type Filter Pills */}
      <div className="filter-pills">
        {types.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`filter-pill ${selectedType === t.key ? "active" : ""}`}
            onClick={() => onSelectType(t.key)}
          >
            <span aria-hidden="true" style={{ marginRight: "4px" }}>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}

        <button
          type="button"
          className={`filter-pill ${pinnedOnly ? "active" : ""}`}
          onClick={() => onTogglePinnedOnly(!pinnedOnly)}
          style={{
            color: pinnedOnly ? "#ffffff" : "var(--accent-amber)",
            backgroundColor: pinnedOnly ? "var(--accent-amber)" : "transparent",
            borderColor: pinnedOnly ? "transparent" : "var(--border-subtle)",
          }}
        >
          <span>★</span> Pinned
        </button>
      </div>

      {/* Sort selection & Reset */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <select
          className="select-field"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
          aria-label="Sort order"
        >
          <option value="newest">↓ Newest First</option>
          <option value="oldest">↑ Oldest First</option>
        </select>

        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  );
};
