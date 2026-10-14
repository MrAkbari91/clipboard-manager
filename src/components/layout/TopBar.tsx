import React from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ThemeMode } from "../../hooks/useTheme";

export interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  isPaused: boolean;
  onToggleCapture: () => void;
  onRequestClearHistory: () => void;
  hasItems: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  search,
  onSearchChange,
  onClearSearch,
  isPaused,
  onToggleCapture,
  onRequestClearHistory,
  hasItems,
  theme,
  onToggleTheme,
}) => {
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <header className="top-bar">
      {/* Search Input with physical KBD badge */}
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>
        <Input
          placeholder="Search by keyword, url, code snippet..."
          className="search-input"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search ? (
          <button
            type="button"
            className="search-clear-btn"
            onClick={onClearSearch}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : (
          <span className="search-shortcut-badge">
            <kbd>{isMac ? "⌘K" : "Ctrl K"}</kbd>
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Theme Toggle Button */}
        <Button
          variant="secondary"
          onClick={onToggleTheme}
          title={`Active theme: ${theme.toUpperCase()}. Click to switch.`}
          aria-label="Toggle light, dark, and system theme"
        >
          {theme === "dark" ? "🌙 Dark" : theme === "light" ? "☀️ Light" : "💻 Auto"}
        </Button>

        {/* Capture Toggle Button */}
        <Button
          variant={isPaused ? "primary" : "secondary"}
          onClick={onToggleCapture}
          icon={isPaused ? "▶" : "⏸"}
          title={isPaused ? "Resume clipboard monitoring" : "Pause clipboard monitoring"}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>

        {/* Clear History Button */}
        <Button
          variant="danger"
          onClick={onRequestClearHistory}
          disabled={!hasItems}
          title="Clear all stored clipboard history"
        >
          🗑 Clear
        </Button>
      </div>
    </header>
  );
};
