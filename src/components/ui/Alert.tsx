import React, { useEffect } from "react";

export interface AlertProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
  autoCloseMs?: number;
}

export const AlertToast: React.FC<AlertProps> = ({
  message,
  type = "info",
  onClose,
  autoCloseMs = 3000,
}) => {
  useEffect(() => {
    if (!autoCloseMs || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [autoCloseMs, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className={`alert-toast ${type}`} role="alert">
      <span>{getIcon()}</span>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            marginLeft: "8px",
            fontSize: "14px",
          }}
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
};
