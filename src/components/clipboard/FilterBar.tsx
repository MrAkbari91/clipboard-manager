import React from "react";
import { ClipboardContentType } from "../../shared/clipboard-contract";
import { Button } from "../ui/Button";
import { Icon, IconName } from "../ui/Icon";

export interface FilterBarProps {
  selectedType: ClipboardContentType | "all"; onSelectType: (type: ClipboardContentType | "all") => void;
  pinnedOnly: boolean; onTogglePinnedOnly: (pinned: boolean) => void;
  sort: "newest" | "oldest"; onSortChange: (sort: "newest" | "oldest") => void;
  onResetFilters: () => void; isFiltered: boolean;
}
export const FilterBar: React.FC<FilterBarProps> = ({ selectedType, onSelectType, pinnedOnly, onTogglePinnedOnly, sort, onSortChange, onResetFilters, isFiltered }) => {
  const types: { key: ClipboardContentType | "all"; label: string; icon: IconName }[] = [
    { key: "all", label: "Everything", icon: "grid" },
    { key: "text", label: "Text", icon: "text" },
    { key: "code", label: "Code", icon: "code" },
    { key: "url", label: "Links", icon: "url" },
    { key: "color", label: "Colors", icon: "color" },
    { key: "image", label: "Images", icon: "image" },
    { key: "video", label: "Videos", icon: "video" },
    { key: "json", label: "JSON", icon: "json" },
    { key: "emoji", label: "Emoji", icon: "emoji" },
  ];
  return <div className="filter-bar"><div className="filter-pills" aria-label="Content filters">{types.map(t => <button key={t.key} className={`filter-pill ${selectedType === t.key ? "active" : ""}`} onClick={() => onSelectType(t.key)} aria-pressed={selectedType === t.key}><Icon name={t.icon} size={16} />{t.label}</button>)}</div><div className="filter-options"><button className={`filter-pill pin-filter ${pinnedOnly ? "active" : ""}`} onClick={() => onTogglePinnedOnly(!pinnedOnly)} aria-pressed={pinnedOnly} title="Show pinned clips only"><Icon name="pin" size={15} />Pinned</button><select className="select-field sort-select" value={sort} onChange={e => onSortChange(e.target.value as "newest" | "oldest")} aria-label="Sort order"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>{isFiltered && <Button variant="ghost" size="sm" onClick={onResetFilters}>Reset</Button>}</div></div>;
};
