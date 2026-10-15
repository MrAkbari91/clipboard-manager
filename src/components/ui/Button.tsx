import React, { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "icon";
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "secondary",
  size = "md",
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const variantClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "danger"
      ? "btn-danger"
      : variant === "ghost"
      ? "btn-ghost"
      : variant === "icon"
      ? "btn-icon"
      : "btn-secondary";

  const sizeClass = size === "sm" ? "btn-sm" : "";

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="btn-icon-wrapper">{icon}</span>}
      {children}
    </button>
  );
};
