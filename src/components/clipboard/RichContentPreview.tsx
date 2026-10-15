import React from "react";
import { ClipboardItem } from "../../shared/clipboard-contract";
import { Icon } from "../ui/Icon";

export function hasRichPreview(item: ClipboardItem): boolean {
  return ["image", "video", "json", "emoji"].includes(item.contentType);
}

export function RichContentPreview({ item, compact = false }: { item: ClipboardItem; compact?: boolean }) {
  const className = `rich-preview ${compact ? "compact" : ""}`;
  if (item.contentType === "image") {
    // Native capture supplies raster data URLs; never fetch remote image content.
    const isRaster = /^data:image\/(png|jpeg|gif|webp);base64,/i.test(item.content);
    return <div className={`${className} image-preview`}>
      {isRaster ? <img src={item.content} alt={item.title || "Clipboard image"} />
        : <span>Image preview unavailable. Use Copy to retrieve the original.</span>}
    </div>;
  }
  if (item.contentType === "json") {
    let formatted = item.content;
    try { formatted = JSON.stringify(JSON.parse(item.content), null, 2); } catch { /* Preserve invalid or legacy content. */ }
    return <pre className={`${className} json-preview`}>{formatted}</pre>;
  }
  if (item.contentType === "emoji") {
    return <div className={`${className} emoji-preview`}>{item.content}</div>;
  }
  if (item.contentType === "video") {
    const isWebLink = /^https?:\/\/[^\s]+$/i.test(item.content);
    return <div className={`${className} video-preview`}>
      <Icon name="video" size={compact ? 22 : 32} />
      <strong>Video source</strong>
      {isWebLink ? <a href={item.content} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()}>{item.content}<Icon name="arrow" size={14} /></a>
        : <span>{item.content}</span>}
    </div>;
  }
  return null;
}
