import React from "react";
import { Icon, IconName } from "../ui/Icon";

export type ActiveNavPage = "all" | "pinned" | "projects" | "settings";
export interface SidebarProps {
  activePage: ActiveNavPage; onNavigate: (page: ActiveNavPage) => void;
  allCount?: number; pinnedCount?: number; projectsCount: number;
  isPaused: boolean; isNativeElectron: boolean;
}
export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, allCount, pinnedCount, projectsCount, isPaused, isNativeElectron }) => {
  const links: { page: ActiveNavPage; label: string; icon: IconName; count?: number }[] = [
    { page: "all", label: "All clips", icon: "clipboard", count: allCount },
    { page: "pinned", label: "Pinned", icon: "pin", count: pinnedCount },
    { page: "projects", label: "Projects", icon: "folder", count: projectsCount },
  ];
  return <aside className="sidebar">
    <div className="brand"><img src="./app-icon.svg" alt="" width="42" height="42" /><div className="brand-title"><strong>Clipboard<span>Brain</span></strong><small>A little space for everything.</small></div></div>
    <div className="workspace-label"><span className="workspace-avatar">P</span><div><strong>Personal workspace</strong><small>{isNativeElectron ? "On this device" : "Browser preview · demo data"}</small></div></div>
    <div className="nav-section-label">WORKSPACE</div>
    <nav aria-label="Main navigation">{links.map(link => <button key={link.page} className={`nav-item ${activePage === link.page ? "active" : ""}`} onClick={() => onNavigate(link.page)} aria-current={activePage === link.page ? "page" : undefined} title={link.label}><Icon name={link.icon} /><span className="nav-label">{link.label}</span>{link.count !== undefined && <span className="nav-badge">{link.count}</span>}</button>)}</nav>
    <div className="sidebar-tip"><span className="tip-icon"><Icon name="spark" /></span><strong>Good ideas deserve a home.</strong><p>Copy it. Keep it. Find it right when you need it.</p><div><kbd>Ctrl</kbd> + <kbd>K</kbd><span> to find a clip</span></div></div>
    <div className="sidebar-bottom"><button className={`nav-item ${activePage === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")} aria-current={activePage === "settings" ? "page" : undefined} title="Settings"><Icon name="settings" /><span className="nav-label">Settings</span></button><div className="status-panel"><div><span className={`status-dot ${isPaused ? "paused" : ""}`} /><strong>{isPaused ? "Capture paused" : isNativeElectron ? "Ready to capture" : "Preview mode"}</strong></div><small><Icon name="shield" size={13} />{isNativeElectron ? "Stored locally. Just for you." : "Changes are temporary"}</small></div><span className="sidebar-version">CLIPBOARD BRAIN <span>v1.0</span></span></div>
  </aside>;
};
