import React, { useState, useEffect } from "react";
import { ClipboardItem } from "./shared/clipboard-contract";
import { useClipboardBrain } from "./hooks/useClipboardBrain";
import { useClipboardItems } from "./hooks/useClipboardItems";
import { useProjects } from "./hooks/useProjects";
import { useCaptureStatus } from "./hooks/useCaptureStatus";
import { Sidebar, ActiveNavPage } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { AllItemsPage } from "./pages/AllItemsPage";
import { PinnedPage } from "./pages/PinnedPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PreviewModal } from "./components/clipboard/PreviewModal";
import { Dialog } from "./components/ui/Dialog";
import { Button } from "./components/ui/Button";
import { AlertToast } from "./components/ui/Alert";

export default function App() {
  const { isNativeElectron } = useClipboardBrain();
  const [activePage, setActivePage] = useState<ActiveNavPage>("all");
  const [previewItem, setPreviewItem] = useState<ClipboardItem | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Hooks
  const {
    items,
    query,
    loading: itemsLoading,
    error: itemsError,
    updateSearch,
    updateContentType,
    updatePinnedOnly,
    updateSort,
    resetFilters,
    copyItem,
    pinItem,
    deleteItem,
    clearHistory,
    assignProject,
    clearError: clearItemsError,
  } = useClipboardItems();

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    createProject,
    clearError: clearProjectsError,
  } = useProjects();

  const {
    isPaused,
    toggleCapture,
    error: captureError,
    clearError: clearCaptureError,
  } = useCaptureStatus();

  // Surface any errors as toasts
  useEffect(() => {
    const err = itemsError || projectsError || captureError;
    if (err) {
      setToast({ message: err, type: "error" });
      clearItemsError();
      clearProjectsError();
      clearCaptureError();
    }
  }, [itemsError, projectsError, captureError, clearItemsError, clearProjectsError, clearCaptureError]);

  // Global Keyboard Shortcuts (Ctrl/Cmd + K for quick search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(".search-input");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update previewItem when its data changes in items list
  useEffect(() => {
    if (previewItem) {
      const updated = items.find((i) => i.id === previewItem.id);
      if (updated) {
        setPreviewItem(updated);
      }
    }
  }, [items, previewItem]);

  const handleCopy = async (id: string): Promise<boolean> => {
    const ok = await copyItem(id);
    if (ok) {
      setToast({ message: "Copied snippet to system clipboard!", type: "success" });
    }
    return ok;
  };

  const handlePin = async (id: string, isPinned: boolean): Promise<boolean> => {
    const ok = await pinItem(id, isPinned);
    if (ok) {
      setToast({
        message: isPinned ? "Item pinned to favorites" : "Item unpinned",
        type: "info",
      });
    }
    return ok;
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    const ok = await deleteItem(id);
    if (ok) {
      setToast({ message: "Item deleted from history", type: "info" });
      if (previewItem?.id === id) {
        setPreviewItem(null);
      }
    }
    return ok;
  };

  const handleAssignProject = async (itemId: string, projectId: string | null): Promise<boolean> => {
    const ok = await assignProject(itemId, projectId);
    if (ok) {
      const proj = projects.find((p) => p.id === projectId);
      setToast({
        message: proj ? `Assigned to ${proj.name}` : "Removed from project",
        type: "info",
      });
    }
    return ok;
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    const count = await clearHistory();
    setIsClearing(false);
    setIsClearDialogOpen(false);
    setToast({
      message: `Cleared ${count} items from history`,
      type: "info",
    });
  };

  const pinnedCount = items.filter((i) => i.isPinned).length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        allCount={items.length}
        pinnedCount={pinnedCount}
        projectsCount={projects.length}
        isPaused={isPaused}
        isNativeElectron={isNativeElectron}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <TopBar
          search={query.search || ""}
          onSearchChange={updateSearch}
          onClearSearch={() => updateSearch("")}
          isPaused={isPaused}
          onToggleCapture={toggleCapture}
          onRequestClearHistory={() => setIsClearDialogOpen(true)}
          hasItems={items.length > 0}
        />

        <main className="page-body">
          {activePage === "all" && (
            <AllItemsPage
              items={items}
              projects={projects}
              loading={itemsLoading}
              query={query}
              onUpdateContentType={updateContentType}
              onUpdatePinnedOnly={updatePinnedOnly}
              onUpdateSort={updateSort}
              onResetFilters={resetFilters}
              onCopy={handleCopy}
              onPin={handlePin}
              onDelete={handleDelete}
              onAssignProject={handleAssignProject}
              onOpenPreview={(item) => setPreviewItem(item)}
            />
          )}

          {activePage === "pinned" && (
            <PinnedPage
              items={items}
              projects={projects}
              loading={itemsLoading}
              onCopy={handleCopy}
              onPin={handlePin}
              onDelete={handleDelete}
              onAssignProject={handleAssignProject}
              onOpenPreview={(item) => setPreviewItem(item)}
              onNavigateAll={() => setActivePage("all")}
            />
          )}

          {activePage === "projects" && (
            <ProjectsPage
              projects={projects}
              items={items}
              loading={projectsLoading}
              onCreateProject={createProject}
              onCopy={handleCopy}
              onPin={handlePin}
              onDelete={handleDelete}
              onAssignProject={handleAssignProject}
              onOpenPreview={(item) => setPreviewItem(item)}
            />
          )}

          {activePage === "settings" && (
            <SettingsPage
              isPaused={isPaused}
              onToggleCapture={toggleCapture}
              onClearHistory={clearHistory}
              totalItemsCount={items.length}
              isNativeElectron={isNativeElectron}
            />
          )}
        </main>
      </div>

      {/* Full Preview Modal */}
      <PreviewModal
        item={previewItem}
        projects={projects}
        onClose={() => setPreviewItem(null)}
        onCopy={handleCopy}
        onPin={handlePin}
        onDelete={handleDelete}
        onAssignProject={handleAssignProject}
      />

      {/* Clear History Confirmation Dialog */}
      <Dialog
        isOpen={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        title="Clear All Clipboard History?"
        description="This will permanently delete all records from your local database."
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", width: "100%" }}>
            <Button variant="ghost" onClick={() => setIsClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={isClearing}
              onClick={handleConfirmClear}
            >
              {isClearing ? "Clearing..." : "Yes, Clear History"}
            </Button>
          </div>
        }
      >
        <p className="text-body" style={{ color: "var(--text-secondary)" }}>
          Are you sure you want to delete all <strong>{items.length} clipboard items</strong>? This action cannot be reversed.
        </p>
      </Dialog>

      {/* Toast Feedback Alert */}
      {toast && (
        <AlertToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
