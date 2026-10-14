import React from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  isPaused: boolean;
  onToggleCapture: () => void;
  onRequestClearHistory: () => void;
  hasItems: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  search,
  onSearchChange,
  onClearSearch,
  isPaused,
  onToggleCapture,
  onRequestClearHistory,
  hasItems,
}) => {
  return (
    <header className="top-bar">
      <Input
        isSearch
        placeholder="Search clipboard by keyword, url, code (Ctrl+K)..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={onClearSearch}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Button
          variant={isPaused ? "primary" : "secondary"}
          onClick={onToggleCapture}
          icon={isPaused ? "▶" : "⏸"}
          title={isPaused ? "Resume automatic clipboard capture" : "Pause clipboard capture"}
        >
          {isPaused ? "Resume Capture" : "Pause Capture"}
        </Button>

        <Button
          variant="danger"
          onClick={onRequestClearHistory}
          disabled={!hasItems}
          icon="🗑"
          title="Clear all stored clipboard history"
        >
          Clear History
        </Button>
      </div>
    </header>
  );
};
