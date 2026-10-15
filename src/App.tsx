import React, { useState, useEffect } from "react";
import { ClipboardItem } from "./shared/clipboard-contract";
import { useClipboardBrain } from "./hooks/useClipboardBrain";
import { useClipboardItems } from "./hooks/useClipboardItems";
import { useProjects } from "./hooks/useProjects";
import { useCaptureStatus } from "./hooks/useCaptureStatus";
import { useTheme } from "./hooks/useTheme";
import { Sidebar, ActiveNavPage } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { AllItemsPage } from "./pages/AllItemsPage";
import { PinnedPage } from "./pages/PinnedPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PreviewModal } from "./components/clipboard/PreviewModal";
import { SidePreviewDrawer } from "./components/clipboard/SidePreviewDrawer";
import { Dialog } from "./components/ui/Dialog";
import { Button } from "./components/ui/Button";
import { AlertToast } from "./components/ui/Alert";
import { Icon } from "./components/ui/Icon";

export default function App() {
  const { api, isNativeElectron } = useClipboardBrain();
  const { theme, toggleTheme, setTheme } = useTheme();

  const [activePage, setActivePage] = useState<ActiveNavPage>("all");
  const [selectedCard, setSelectedCard] = useState<ClipboardItem | null>(null);
  const [modalItem, setModalItem] = useState<ClipboardItem | null>(null);
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

  // Sync selected and modal items if their attributes change in items list
  useEffect(() => {
    if (selectedCard) {
      const updated = items.find((i) => i.id === selectedCard.id);
      if (updated) setSelectedCard(updated);
      else setSelectedCard(null);
    }
  }, [items, selectedCard]);

  useEffect(() => {
    if (modalItem) {
      const updated = items.find((i) => i.id === modalItem.id);
      if (updated) setModalItem(updated);
      else setModalItem(null);
    }
  }, [items, modalItem]);

  const handleCopy = async (id: string): Promise<boolean> => {
    const ok = await copyItem(id);
    if (ok) {
      setToast({ message: "Copied to clipboard!", type: "success" });
    }
    return ok;
  };

  const handlePin = async (id: string, isPinned: boolean): Promise<boolean> => {
    const ok = await pinItem(id, isPinned);
    if (ok) {
      setToast({
        message: isPinned ? "Pinned to favorites" : "Unpinned",
        type: "info",
      });
    }
    return ok;
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    const ok = await deleteItem(id);
    if (ok) {
      setToast({ message: "Item removed from history", type: "info" });
      if (selectedCard?.id === id) setSelectedCard(null);
      if (modalItem?.id === id) setModalItem(null);
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
    if (count === null) return;
    setIsClearDialogOpen(false);
    setSelectedCard(null);
    setModalItem(null);
    setToast({
      message: `Cleared ${count} unpinned items. Pinned clips were preserved.`,
      type: "info",
    });
  };

  const handleOpenStorageFolder = async () => {
    try {
      const category = activePage === "all" && query.contentType !== "all" ? query.contentType : undefined;
      const result = await api.openStorageFolder(category);
      setToast({ message: result.success ? "Storage folder opened" : "Unable to open storage folder", type: result.success ? "info" : "error" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Unable to open storage folder", type: "error" });
    }
  };

  const pinnedCount = items.filter((i) => i.isPinned).length;
  const isCollectionFiltered = Boolean(query.search || query.pinnedOnly || (query.contentType && query.contentType !== "all"));

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          setSelectedCard(null);
          resetFilters();
        }}
        allCount={isCollectionFiltered ? undefined : items.length}
        pinnedCount={isCollectionFiltered ? undefined : pinnedCount}
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
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenStorageFolder={isNativeElectron ? handleOpenStorageFolder : undefined}
        />

        <div className="content-split-layout">
          <main className="page-body">
            <div className="page-heading">
              <div><div className="eyebrow">YOUR PERSONAL SECOND BRAIN</div><h1>{{ all: "A home for every copy.", pinned: "Keep the good stuff close.", projects: "A little more organized.", settings: "Make yourself at home." }[activePage]}</h1><p>{{ all: "Less searching. More creating. Everything you copy, in one calm space.", pinned: "Your go-to snippets, saved for the moments that matter.", projects: "Bring related ideas, snippets, and resources together.", settings: "Your workspace, your preferences, your flow." }[activePage]}</p></div>
              <span className="heading-mark"><Icon name={activePage === "pinned" ? "pin" : activePage === "projects" ? "folder" : activePage === "settings" ? "settings" : "clipboard"} size={32} /></span>
            </div>
            {activePage === "all" && (
              <AllItemsPage
                items={items}
                projects={projects}
                loading={itemsLoading}
                query={query}
                selectedItemId={selectedCard?.id}
                onSelectCard={(item) => window.innerWidth <= 1100 ? setModalItem(item) : setSelectedCard(item)}
                onUpdateContentType={updateContentType}
                onUpdatePinnedOnly={updatePinnedOnly}
                onUpdateSort={updateSort}
                onResetFilters={resetFilters}
                onCopy={handleCopy}
                onPin={handlePin}
                onDelete={handleDelete}
                onAssignProject={handleAssignProject}
                onOpenPreview={(item) => setModalItem(item)}
              />
            )}

            {activePage === "pinned" && (
              <PinnedPage
                items={items}
                projects={projects}
                loading={itemsLoading}
                selectedItemId={selectedCard?.id}
                onSelectCard={(item) => window.innerWidth <= 1100 ? setModalItem(item) : setSelectedCard(item)}
                onCopy={handleCopy}
                onPin={handlePin}
                onDelete={handleDelete}
                onAssignProject={handleAssignProject}
                onOpenPreview={(item) => setModalItem(item)}
                onNavigateAll={() => setActivePage("all")}
              />
            )}

            {activePage === "projects" && (
              <ProjectsPage
                projects={projects}
                items={items}
                loading={projectsLoading}
                selectedItemId={selectedCard?.id}
                onSelectCard={(item) => window.innerWidth <= 1100 ? setModalItem(item) : setSelectedCard(item)}
                onCreateProject={createProject}
                onCopy={handleCopy}
                onPin={handlePin}
                onDelete={handleDelete}
                onAssignProject={handleAssignProject}
                onOpenPreview={(item) => setModalItem(item)}
              />
            )}

            {activePage === "settings" && (
              <SettingsPage
                isPaused={isPaused}
                onToggleCapture={toggleCapture}
                onClearHistory={clearHistory}
                totalItemsCount={items.length}
                isNativeElectron={isNativeElectron}
                theme={theme}
                onSetTheme={setTheme}
              />
            )}
            <footer className="workspace-footer"><span><Icon name="shield" size={14} />{isNativeElectron ? "Your clipboard stays on this device." : "Browser preview · sample clips are not saved."}</span><span>Made for a clearer mind.</span></footer>
          </main>

          {/* Desktop Side Inspector Drawer (opens when a card is selected) */}
          {selectedCard && (
            <SidePreviewDrawer
              item={selectedCard}
              projects={projects}
              onClose={() => setSelectedCard(null)}
              onCopy={handleCopy}
              onPin={handlePin}
              onDelete={handleDelete}
              onAssignProject={handleAssignProject}
            />
          )}
        </div>
      </div>

      {/* Full Preview Modal */}
      <PreviewModal
        item={modalItem}
        projects={projects}
        onClose={() => setModalItem(null)}
        onCopy={handleCopy}
        onPin={handlePin}
        onDelete={handleDelete}
        onAssignProject={handleAssignProject}
      />

      {/* Clear History Confirmation Dialog */}
      <Dialog
        isOpen={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        title="Clear unpinned history?"
        description="Pinned clips will be kept. Files already saved in your storage folders will remain."
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
          Delete all unpinned clips from your history, including clips outside the current filter? This action cannot be reversed.
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
