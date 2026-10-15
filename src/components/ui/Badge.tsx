import React from "react";
import { ClipboardContentType } from "../../shared/clipboard-contract";
import { Icon } from "./Icon";

export interface BadgeProps {
  type: ClipboardContentType | "pinned";
  label?: string;
  className?: string;
}
export const Badge: React.FC<BadgeProps> = ({ type, label, className = "" }) => (
  <span className={`badge badge-${type} ${className}`}>
    <Icon name={type === "pinned" ? "pin" : type} size={12} />
    <span>{label || type}</span>
  </span>
);
