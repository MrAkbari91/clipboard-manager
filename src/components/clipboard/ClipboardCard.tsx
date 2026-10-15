import React, { useEffect, useRef, useState } from "react";
import { ClipboardContentType, ClipboardItem, Project } from "../../shared/clipboard-contract";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { hasRichPreview, RichContentPreview } from "./RichContentPreview";

export interface ClipboardCardProps {
  item: ClipboardItem; projects: Project[]; isSelected?: boolean;
  onSelect?: (item: ClipboardItem) => void;
  onCopy: (id: string) => Promise<boolean>;
  onPin: (id: string, isPinned: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAssignProject: (itemId: string, projectId: string | null) => Promise<boolean>;
  onOpenPreview: (item: ClipboardItem) => void;
}
const typeLabels: Record<ClipboardContentType, string> = {
  text: "Text", code: "Code snippet", url: "Link", color: "Color",
  image: "Image", video: "Video", json: "JSON", emoji: "Emoji",
};
function timeAgo(value: string) {
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
export const ClipboardCard: React.FC<ClipboardCardProps> = ({ item, projects, isSelected = false, onSelect, onCopy, onPin, onDelete, onAssignProject, onOpenPreview }) => {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const handleCopy = async () => {
    if (await onCopy(item.id)) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }
  };
  const handleDelete = async () => {
    setIsDeleting(true);
    try { await onDelete(item.id); } finally { setIsDeleting(false); }
  };
  let hostname = item.content;
  if (item.contentType === "url") {
    try { hostname = new URL(item.content).hostname; } catch { /* Show the original clip for invalid URLs. */ }
  }
  return <article className={`clipboard-card type-${item.contentType} ${item.isPinned ? "pinned" : ""} ${isSelected ? "active-selected" : ""}`}
    onClick={() => onSelect?.(item)} tabIndex={0}
    onKeyDown={e => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenPreview(item); }
    }} aria-label={`Clipboard item: ${item.title || typeLabels[item.contentType]}`}>
    <div className="card-top-row"><span className={`card-type-label ${item.contentType}`}><Icon name={item.contentType} size={16} />{typeLabels[item.contentType]}</span><button className={`card-pin ${item.isPinned ? "is-pinned" : ""}`} title={item.isPinned ? "Unpin item" : "Pin item"} aria-label={item.isPinned ? "Unpin item" : "Pin item"} aria-pressed={item.isPinned} onClick={e => { e.stopPropagation(); void onPin(item.id, !item.isPinned); }}><Icon name="pin" size={16} /></button></div>
    <h3 className="card-title">{item.title || (item.contentType === "url" ? hostname : typeLabels[item.contentType])}</h3>
    <div className="card-preview">
      {hasRichPreview(item) ? <RichContentPreview item={item} compact />
      : item.contentType === "code" ? <div className="code-container-preview"><div className="code-window-header"><span /><span /><span /><small>SNIPPET</small></div><pre>{item.content}</pre></div>
      : item.contentType === "color" ? <div className="color-card-preview"><div className="large-color-swatch" style={{ backgroundColor: item.content }} /><div className="color-caption"><strong>{item.content}</strong><span>HEX COLOR</span></div></div>
      : item.contentType === "url" ? <div className="url-card-preview"><span className="link-avatar"><Icon name="url" size={24} /></span><strong>{hostname}</strong><a href={/^https?:\/\//i.test(item.content) ? item.content : undefined} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{item.content}<Icon name="arrow" size={14} /></a></div>
      : <p className="card-body-preview">{item.content}</p>}
    </div>
    <div className="card-project-row" onClick={e => e.stopPropagation()}><Icon name="folder" size={13} /><select aria-label={`Project for ${item.title || typeLabels[item.contentType]}`} value={item.projectId || ""} onChange={e => void onAssignProject(item.id, e.target.value || null)}><option value="">No project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><span>{item.content.length.toLocaleString()} characters</span></div>
    <div className="card-bottom-row"><time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString()}><Icon name="clock" size={13} />{timeAgo(item.createdAt)}</time><div className="card-quick-actions" onClick={e => e.stopPropagation()}><Button variant="ghost" size="sm" onClick={() => onOpenPreview(item)} title="Open full preview" aria-label="Open full preview"><Icon name="expand" size={15} /></Button><Button variant="ghost" size="sm" disabled={isDeleting} onClick={handleDelete} title="Delete item" aria-label="Delete item"><Icon name="trash" size={15} /></Button><Button variant={copied ? "primary" : "secondary"} size="sm" onClick={handleCopy} aria-label="Copy to system clipboard" icon={<Icon name={copied ? "check" : "copy"} size={14} />}>{copied ? "Copied" : "Copy"}</Button></div></div>
  </article>;
};
