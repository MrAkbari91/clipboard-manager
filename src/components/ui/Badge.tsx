import React from "react";
import { ClipboardContentType } from "../../shared/clipboard-contract";

export interface BadgeProps {
  type: ClipboardContentType | "pinned";
  label?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label, className = "" }) => {
  const getBadgeClass = () => {
    switch (type) {
      case "code":
        return "badge-code";
      case "url":
        return "badge-url";
      case "color":
        return "badge-color";
      case "pinned":
        return "badge-pinned";
      default:
        return "badge-text";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "code":
        return "💻";
      case "url":
        return "🔗";
      case "color":
        return "🎨";
      case "pinned":
        return "★";
      default:
        return "📄";
    }
  };

  return (
    <span className={`badge ${getBadgeClass()} ${className}`.trim()}>
      <span aria-hidden="true">{getIcon()}</span>
      <span>{label || type}</span>
    </span>
  );
};
