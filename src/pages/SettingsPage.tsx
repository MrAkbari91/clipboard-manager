import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";

export interface SettingsPageProps {
  isPaused: boolean;
  onToggleCapture: () => Promise<boolean>;
  onClearHistory: () => Promise<number>;
  totalItemsCount: number;
  isNativeElectron: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isPaused,
  onToggleCapture,
  onClearHistory,
  totalItemsCount,
  isNativeElectron,
}) => {
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [clearedMessage, setClearedMessage] = useState<string | null>(null);

  const handleConfirmClear = async () => {
    setIsClearing(true);
    const count = await onClearHistory();
    setIsClearing(false);
    setIsConfirmClearOpen(false);
    setClearedMessage(`Successfully cleared ${count} clipboard records from local database.`);
    setTimeout(() => setClearedMessage(null), 4000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "700px" }}>
      <div>
        <h2 className="title-lg">Settings & Privacy</h2>
        <p className="text-body">Manage clipboard monitoring preferences, storage, and privacy controls.</p>
      </div>

      {clearedMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-success-bg)",
            color: "var(--color-success)",
            border: "1px solid var(--color-success)",
            fontSize: "0.875rem",
          }}
        >
          ✓ {clearedMessage}
        </div>
      )}

      {/* Section 1: Capture Control */}
      <section
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 className="title-md">Automatic Clipboard Capture</h3>
            <p className="text-body" style={{ marginTop: "4px" }}>
              {isPaused
                ? "Monitoring is currently paused. No new copied text or snippets will be saved."
                : "Clipboard Brain actively listens to your system clipboard and catalogs copied items."}
            </p>
          </div>
          <Button
            variant={isPaused ? "primary" : "secondary"}
            onClick={onToggleCapture}
            icon={isPaused ? "▶" : "⏸"}
          >
            {isPaused ? "Resume Capture" : "Pause Capture"}
          </Button>
        </div>
      </section>

      {/* Section 2: Storage & Data Management */}
      <section
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 className="title-md">Clear Clipboard History</h3>
            <p className="text-body" style={{ marginTop: "4px" }}>
              Permanently purge all saved clipboard items from your local database. Pinned items will also be removed.
            </p>
            <span className="text-small" style={{ color: "var(--text-muted)" }}>
              Current database records: {totalItemsCount} items
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
        </div>
      </section>

      {/* Section 3: Privacy & Security Statement */}
      <section
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <h3 className="title-md" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🛡️</span> Privacy & Local-First Architecture
        </h3>
        <p className="text-body" style={{ lineHeight: 1.6 }}>
          • <strong>Local-first storage:</strong> All clipboard data, projects, and metadata are stored exclusively on your local machine using SQLite.
          <br />
          • <strong>Zero Telemetry & Cloud:</strong> Clipboard Brain never sends any copied text, passwords, or snippets to external servers, cloud providers, or third-party analytics.
          <br />
          • <strong>Context Isolation:</strong> The renderer UI runs in an isolated sandbox with no direct Node.js access, protecting against malicious script execution.
          <br />
          • <strong>Platform status:</strong> {isNativeElectron ? "Connected to Electron IPC bridge." : "Running in development sandbox mode."}
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
