import React from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Icon } from "../ui/Icon";
import { ThemeMode } from "../../hooks/useTheme";

export interface TopBarProps {
  search: string; onSearchChange: (value: string) => void; onClearSearch: () => void;
  isPaused: boolean; onToggleCapture: () => void; onRequestClearHistory: () => void;
  hasItems: boolean; theme: ThemeMode; onToggleTheme: () => void;
}
export const TopBar: React.FC<TopBarProps> = ({ search, onSearchChange, onClearSearch, isPaused, onToggleCapture, onRequestClearHistory, hasItems, theme, onToggleTheme }) => {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  return <header className="top-bar">
    <div className="search-input-wrapper"><span className="search-icon"><Icon name="search" /></span><Input aria-label="Search clipboard" placeholder="Search your clipboard…" className="search-input" value={search} onChange={e => onSearchChange(e.target.value)} />{search ? <button className="search-clear-btn" onClick={onClearSearch} aria-label="Clear search"><Icon name="close" size={15} /></button> : <span className="search-shortcut-badge"><kbd>{isMac ? "⌘ K" : "Ctrl K"}</kbd></span>}</div>
    <div className="topbar-actions"><Button variant="ghost" className="theme-toggle" onClick={onToggleTheme} title={`Theme: ${theme}. Click to switch.`} aria-label={`Change theme, currently ${theme}`}><Icon name={theme === "dark" ? "moon" : theme === "light" ? "sun" : "monitor"} /></Button><span className="toolbar-divider" /><Button variant="secondary" onClick={onToggleCapture} icon={<Icon name={isPaused ? "play" : "pause"} size={15} />}><span>{isPaused ? "Resume capture" : "Pause capture"}</span></Button><Button variant="ghost" className="clear-history" onClick={onRequestClearHistory} disabled={!hasItems} title="Clear history" aria-label="Clear history"><Icon name="trash" size={17} /></Button></div>
  </header>;
};
