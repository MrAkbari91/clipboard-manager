import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "📋",
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3 className="title-md" style={{ marginBottom: "6px" }}>
        {title}
      </h3>
      <p className="text-body" style={{ maxWidth: "380px", marginBottom: "16px" }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
