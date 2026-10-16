import React, { useState, useEffect } from "react";
import { Icon, IconName } from "../components/ui/Icon";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { ThemeMode } from "../hooks/useTheme";
import { ClipboardContentType } from "../shared/clipboard-contract";

export interface SettingsPageProps {
  isPaused: boolean;
  onToggleCapture: () => Promise<boolean>;
  onClearHistory: () => Promise<number | null>;
  totalItemsCount: number;
  isNativeElectron: boolean;
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
}

interface ContentTypeConfig {
  key: ClipboardContentType;
  label: string;
  icon: IconName;
  description: string;
  badgeColor: string;
  badgeBg: string;
}

const ALL_TYPES: ContentTypeConfig[] = [
  {
    key: "text",
    label: "Text",
    icon: "text",
    description: "Plain text, paragraphs, and general notes",
    badgeColor: "var(--text-secondary)",
    badgeBg: "var(--bg-surface-elevated)",
  },
  {
    key: "code",
    label: "Code",
    icon: "code",
    description: "Programming code, syntax, and snippets",
    badgeColor: "var(--accent-purple)",
    badgeBg: "var(--accent-purple-subtle)",
  },
  {
    key: "url",
    label: "Links",
    icon: "url",
    description: "Web URLs, domains, and web addresses",
    badgeColor: "var(--accent-cyan)",
    badgeBg: "var(--accent-cyan-subtle)",
  },
  {
    key: "color",
    label: "Colors",
    icon: "color",
    description: "Hex, RGB, RGBA, and HSL color values",
    badgeColor: "var(--accent-amber)",
    badgeBg: "var(--accent-amber-subtle)",
  },
  {
    key: "image",
    label: "Images",
    icon: "image",
    description: "Screenshots, photos, and copied image files",
    badgeColor: "var(--accent-indigo)",
    badgeBg: "var(--accent-indigo-subtle)",
  },
  {
    key: "video",
    label: "Videos",
    icon: "video",
    description: "YouTube, Vimeo links, and video media clips",
    badgeColor: "var(--accent-rose)",
    badgeBg: "var(--accent-rose-subtle)",
  },
  {
    key: "json",
    label: "JSON",
    icon: "json",
    description: "Structured JSON objects and data payloads",
    badgeColor: "var(--accent-cyan)",
    badgeBg: "var(--accent-cyan-subtle)",
  },
  {
    key: "emoji",
    label: "Emoji",
    icon: "emoji",
    description: "Standalone emoji symbols and pictographs",
    badgeColor: "var(--accent-amber)",
    badgeBg: "var(--accent-amber-subtle)",
  },
];

const PERMISSIONS_STORAGE_KEY = "clipboard_brain_allowed_types";

function getStoredPermissions(): ClipboardContentType[] {
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as ClipboardContentType[];
      }
    }
  } catch {}
  return ALL_TYPES.map((t) => t.key);
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

  // Content permissions state (initialized synchronously from persistent storage)
  const [allowedTypes, setAllowedTypes] = useState<ClipboardContentType[]>(getStoredPermissions);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  // Sync with backend on mount
  useEffect(() => {
    if (window.clipboardBrain?.getCapturePermissions) {
      window.clipboardBrain
        .getCapturePermissions()
        .then((res) => {
          if (res && Array.isArray(res.allowedTypes)) {
            const stored = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                  setAllowedTypes(parsed);
                  window.clipboardBrain.setCapturePermissions?.(parsed);
                  return;
                }
              } catch {}
            }
            setAllowedTypes(res.allowedTypes);
            localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(res.allowedTypes));
          }
        })
        .catch((err) => {
          console.error("Failed to fetch capture permissions:", err);
        });
    }
  }, []);

  const handleToggleType = async (type: ClipboardContentType) => {
    const updated = allowedTypes.includes(type)
      ? allowedTypes.filter((t) => t !== type)
      : [...allowedTypes, type];

    setAllowedTypes(updated);

    try {
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    if (window.clipboardBrain?.setCapturePermissions) {
      try {
        await window.clipboardBrain.setCapturePermissions(updated);
      } catch (err) {
        console.error("Failed to save capture permission:", err);
      }
    }

    const isNowAllowed = updated.includes(type);
    setPermissionNotice(
      `${ALL_TYPES.find((t) => t.key === type)?.label ?? type} capture ${
        isNowAllowed ? "permitted ✓" : "blocked ✗"
      }`
    );
    setTimeout(() => setPermissionNotice(null), 3000);
  };

  const handleSelectAll = async () => {
    const all: ClipboardContentType[] = ALL_TYPES.map((t) => t.key);
    setAllowedTypes(all);

    try {
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(all));
    } catch {}

    if (window.clipboardBrain?.setCapturePermissions) {
      try {
        await window.clipboardBrain.setCapturePermissions(all);
      } catch (err) {
        console.error("Failed to save capture permissions:", err);
      }
    }
    setPermissionNotice("All content types permitted ✓");
    setTimeout(() => setPermissionNotice(null), 3000);
  };

  const handleDeselectAll = async () => {
    setAllowedTypes([]);

    try {
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify([]));
    } catch {}

    if (window.clipboardBrain?.setCapturePermissions) {
      try {
        await window.clipboardBrain.setCapturePermissions([]);
      } catch (err) {
        console.error("Failed to save capture permissions:", err);
      }
    }
    setPermissionNotice("All content types blocked ✗");
    setTimeout(() => setPermissionNotice(null), 3000);
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    const count = await onClearHistory();
    setIsClearing(false);
    if (count === null) return;
    setIsConfirmClearOpen(false);
    setClearedMessage(`Cleared ${count} unpinned clips. Pinned clips were preserved.`);
    setTimeout(() => setClearedMessage(null), 4000);
  };

  return (
    <div
      className="settings-page"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        maxWidth: "880px",
        paddingBottom: "32px",
      }}
    >
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Settings & Preferences</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
          Customize your clipboard permissions, theme appearance, and data privacy.
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

      {permissionNotice && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--accent-indigo-subtle)",
            color: "var(--accent-indigo)",
            border: "1px solid var(--accent-indigo)",
            fontSize: "0.8125rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icon name="check" size={16} /> {permissionNotice}
        </div>
      )}

      {/* SECTION: CONTENT PERMISSIONS (કન્ટેન્ટ કૉપિ પરમિશન) */}
      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>
                Capture Permissions (કન્ટેન્ટ પરમિશન)
              </h3>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  backgroundColor:
                    allowedTypes.length === 0
                      ? "var(--accent-rose-subtle)"
                      : allowedTypes.length === ALL_TYPES.length
                      ? "var(--accent-emerald-subtle)"
                      : "var(--accent-indigo-subtle)",
                  color:
                    allowedTypes.length === 0
                      ? "var(--accent-rose)"
                      : allowedTypes.length === ALL_TYPES.length
                      ? "var(--accent-emerald)"
                      : "var(--accent-indigo)",
                }}
              >
                {allowedTypes.length === 0
                  ? "None Permitted"
                  : allowedTypes.length === ALL_TYPES.length
                  ? "All Permitted (8/8)"
                  : `${allowedTypes.length} of ${ALL_TYPES.length} Permitted`}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                marginTop: "4px",
                lineHeight: 1.5,
              }}
            >
              Control which types of copied content are permitted to be recorded into your history.
              Disallowed types will never be saved.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              disabled={allowedTypes.length === ALL_TYPES.length}
            >
              Allow All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              disabled={allowedTypes.length === 0}
            >
              Block All
            </Button>
          </div>
        </div>

        {allowedTypes.length === 0 && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-amber-subtle)",
              color: "var(--accent-amber)",
              border: "1px solid var(--accent-amber)",
              fontSize: "0.8125rem",
              fontWeight: 500,
            }}
          >
            ⚠️ All content types are blocked. Clipboard Brain will not record any copied items until
            at least one type is permitted.
          </div>
        )}

        {/* Responsive Grid of Content Types */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "12px",
            marginTop: "4px",
          }}
        >
          {ALL_TYPES.map((typeConfig) => {
            const isAllowed = allowedTypes.includes(typeConfig.key);

            return (
              <div
                key={typeConfig.key}
                onClick={() => handleToggleType(typeConfig.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToggleType(typeConfig.key);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: isAllowed
                    ? "1px solid var(--border-medium)"
                    : "1px dashed var(--border-subtle)",
                  backgroundColor: isAllowed ? "var(--bg-card)" : "var(--bg-app)",
                  opacity: isAllowed ? 1 : 0.65,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: isAllowed
                        ? typeConfig.badgeBg
                        : "var(--bg-surface-elevated)",
                      color: isAllowed ? typeConfig.badgeColor : "var(--text-muted)",
                      display: "grid",
                      placeItems: "center",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <Icon name={typeConfig.icon} size={18} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                        {typeConfig.label}
                      </strong>
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      {typeConfig.description}
                    </div>
                  </div>
                </div>

                {/* Modern Switch Toggle */}
                <div
                  aria-checked={isAllowed}
                  role="switch"
                  style={{
                    width: "42px",
                    height: "24px",
                    borderRadius: "12px",
                    backgroundColor: isAllowed
                      ? "var(--accent-indigo)"
                      : "var(--border-medium)",
                    position: "relative",
                    flexShrink: 0,
                    transition: "background-color 200ms ease",
                    boxShadow: isAllowed ? "var(--shadow-glow)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      backgroundColor: "#ffffff",
                      position: "absolute",
                      top: "3px",
                      left: isAllowed ? "21px" : "3px",
                      transition: "left 200ms ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
              aria-pressed={theme === mode}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border:
                  theme === mode
                    ? "2px solid var(--accent-indigo)"
                    : "1px solid var(--border-medium)",
                backgroundColor:
                  theme === mode ? "var(--accent-indigo-subtle)" : "var(--bg-input)",
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
              <span className={`theme-preview ${mode}`} aria-hidden="true" />
              <span style={{ textTransform: "capitalize" }}>{mode} Mode</span>
            </button>
          ))}
        </div>
      </section>

      {/* Section: Master Capture Control */}
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
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>
            Master Background Capture Switch
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {isPaused
              ? "All clipboard capture is currently paused."
              : isNativeElectron
              ? "Clipboard Brain is actively monitoring permitted content types."
              : "Browser preview uses sample clips. Open desktop app to capture your clipboard."}
          </p>
        </div>
        <Button
          variant={isPaused ? "primary" : "secondary"}
          onClick={onToggleCapture}
          icon={<Icon name={isPaused ? "play" : "pause"} size={15} />}
        >
          {isPaused ? "Resume Capture" : "Pause Capture"}
        </Button>
      </section>

      {/* Section: Storage & Data Management */}
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
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600 }}>Clear clipboard history</h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Delete unpinned clips from history. Pinned clips and files in storage folders will
            remain.
          </p>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              display: "block",
              marginTop: "4px",
            }}
          >
            {totalItemsCount} clips in your collection.
          </span>
        </div>
        <Button
          variant="danger"
          disabled={totalItemsCount === 0}
          onClick={() => setIsConfirmClearOpen(true)}
          icon={<Icon name="trash" size={16} />}
        >
          Clear History
        </Button>
      </section>

      {/* Section: Privacy & Security Statement */}
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
        <h3
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Icon name="shield" /> Private & Local by design
        </h3>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {isNativeElectron
            ? "Your clipboard history and permission settings are stored strictly on this device. Disallowed content types are ignored in memory and never written to disk."
            : "You are exploring the browser preview. Use the desktop application to save and capture your clipboard."}
        </p>
      </section>

      {/* Clear Confirmation Modal */}
      <Dialog
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        title="Clear unpinned history?"
        description="This cannot be undone. Pinned clips and files in storage folders will remain."
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              width: "100%",
            }}
          >
            <Button variant="ghost" onClick={() => setIsConfirmClearOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={isClearing}
              onClick={handleConfirmClear}
            >
              {isClearing ? "Clearing..." : "Clear unpinned clips"}
            </Button>
          </div>
        }
      >
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          Are you sure you want to delete all unpinned clips from your history?
        </p>
      </Dialog>
    </div>
  );
};
