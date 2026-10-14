import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { ThemeMode } from "../hooks/useTheme";

export interface SettingsPageProps {
  isPaused: boolean;
  onToggleCapture: () => Promise<boolean>;
  onClearHistory: () => Promise<number>;
  totalItemsCount: number;
  isNativeElectron: boolean;
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isPaused,
  onToggleCapture,
  onClearHistory,
  totalItemsCount,
  isNativeElectron,
  theme,
  onSetTheme,
}) => {
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [clearedMessage, setClearedMessage] = useState<string | null>(null);

  const handleConfirmClear = async () => {
    setIsClearing(true);
    const count = await onClearHistory();
    setIsClearing(false);
    setIsConfirmClearOpen(false);
    setClearedMessage(`Successfully cleared ${count} clipboard items from database.`);
    setTimeout(() => setClearedMessage(null), 4000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px" }}>
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Settings & Preferences</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
          Customize your interface theme, clipboard monitoring behavior, and privacy settings.
        </p>
      </div>

      {clearedMessage && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--accent-emerald-subtle)",
            color: "var(--accent-emerald)",
            border: "1px solid var(--accent-emerald)",
            fontSize: "0.8125rem",
            fontWeight: 500,
          }}
        >
          ✓ {clearedMessage}
        </div>
      )}

      {/* Theme Selection */}
      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "18px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Appearance</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "2px" }}>
            Select your preferred color theme or match your operating system.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSetTheme(mode)}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: theme === mode ? "2px solid var(--accent-indigo)" : "1px solid var(--border-medium)",
                backgroundColor: theme === mode ? "var(--accent-indigo-subtle)" : "var(--bg-input)",
                color: theme === mode ? "var(--accent-indigo)" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8125rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                transition: "all var(--transition-fast)",
              }}
            >
              <span style={{ fontSize: "1.25rem" }}>
                {mode === "light" ? "☀️" : mode === "dark" ? "🌙" : "💻"}
              </span>
              <span style={{ textTransform: "capitalize" }}>{mode} Mode</span>
            </button>
          ))}
        </div>
      </section>

      {/* Section 1: Capture Control */}
      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Background Clipboard Capture</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {isPaused
              ? "Capture is paused. No new items will be stored until resumed."
              : "Active. Clipboard Brain monitors the OS clipboard every 700ms and stores new items."}
          </p>
        </div>
        <Button
          variant={isPaused ? "primary" : "secondary"}
          onClick={onToggleCapture}
          icon={isPaused ? "▶" : "⏸"}
        >
          {isPaused ? "Resume Capture" : "Pause Capture"}
        </Button>
      </section>

      {/* Section 2: Storage & Data Management */}
      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Purge Clipboard History</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Permanently delete all clipboard items and code snippets stored on this device.
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
            Database contains {totalItemsCount} total records.
          </span>
        </div>
        <Button
          variant="danger"
          disabled={totalItemsCount === 0}
          onClick={() => setIsConfirmClearOpen(true)}
          icon="🗑"
        >
          Clear History
        </Button>
      </section>

      {/* Section 3: Privacy & Security Statement */}
      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "18px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🛡️</span> 100% Local-First Privacy Guarantee
        </h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          • <strong>Zero External Servers:</strong> Your clipboard history is saved strictly to your machine&apos;s local SQLite database.
          <br />
          • <strong>No Analytics or Tracking:</strong> Neither content nor metadata is ever transmitted over the network.
          <br />
          • <strong>Process Security:</strong> {isNativeElectron ? "Connected to Electron IPC bridge via Context Isolation." : "Running inside browser dev sandbox."}
        </p>
      </section>

      {/* Clear Confirmation Modal */}
      <Dialog
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        title="Clear All Clipboard History?"
        description="This action cannot be undone. All saved items and snippets will be permanently deleted."
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", width: "100%" }}>
            <Button variant="ghost" onClick={() => setIsConfirmClearOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={isClearing}
              onClick={handleConfirmClear}
            >
              {isClearing ? "Clearing..." : "Yes, Delete Everything"}
            </Button>
          </div>
        }
      >
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          Are you sure you want to delete all <strong>{totalItemsCount} items</strong>?
        </p>
      </Dialog>
    </div>
  );
};
