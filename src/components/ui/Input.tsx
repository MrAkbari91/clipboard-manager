import React, { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  isSearch?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ isSearch, onClear, value, className = "", ...props }, ref) => {
    if (isSearch) {
      return (
        <div className="search-input-wrapper">
          <span className="search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            ref={ref}
            type="text"
            className={`input-field search-input ${className}`.trim()}
            value={value}
            {...props}
          />
          {value && onClear && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={onClear}
              aria-label="Clear search input"
            >
              ✕
            </button>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={`input-field ${className}`.trim()}
        value={value}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
