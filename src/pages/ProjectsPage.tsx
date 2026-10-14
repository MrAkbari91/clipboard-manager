import React, { useState } from "react";
import { ClipboardItem, Project } from "../shared/clipboard-contract";
import { ClipboardCard } from "../components/clipboard/ClipboardCard";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";

export interface ProjectsPageProps {
  projects: Project[];
  items: ClipboardItem[];
  loading: boolean;
  onCreateProject: (name: string, description?: string) => Promise<Project | null>;
  onCopy: (id: string) => Promise<boolean>;
  onPin: (id: string, isPinned: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onAssignProject: (itemId: string, projectId: string | null) => Promise<boolean>;
  onOpenPreview: (item: ClipboardItem) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  items,
  loading,
  onCreateProject,
  onCopy,
  onPin,
  onDelete,
  onAssignProject,
  onOpenPreview,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newProjectDesc, setNewProjectDesc] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If selectedProjectId is null but we have projects, select first
  const currentProjectId = selectedProjectId || (projects.length > 0 ? projects[0].id : null);
  const currentProject = projects.find((p) => p.id === currentProjectId);

  const projectItems = items.filter((i) => i.projectId === currentProjectId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsSubmitting(true);
    const created = await onCreateProject(newProjectName, newProjectDesc);
    setIsSubmitting(false);

    if (created) {
      setSelectedProjectId(created.id);
      setNewProjectName("");
      setNewProjectDesc("");
      setIsCreateOpen(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Header with Create Project Button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 className="title-lg">Projects & Collections</h2>
          <p className="text-body">Group related snippets, documentation links, and assets together.</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateOpen(true)} icon="➕">
          New Project
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          <p className="text-body">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects created yet"
          description="Create your first project to organize your clipboard history into topics like React App, DevOps, or Design System."
          actionLabel="Create First Project"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <>
          {/* Project Tabs Bar */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "8px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            {projects.map((proj) => {
              const count = items.filter((i) => i.projectId === proj.id).length;
              const isActive = proj.id === currentProjectId;
              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => setSelectedProjectId(proj.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: isActive ? "var(--color-primary)" : "var(--bg-card)",
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    border: `1px solid ${isActive ? "transparent" : "var(--border-subtle)"}`,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    whiteSpace: "nowrap",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <span>📁</span>
                  <span>{proj.name}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "var(--bg-input)",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Project Details */}
          {currentProject && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <h3 className="title-md" style={{ color: "var(--text-primary)", marginBottom: "4px" }}>
                  📁 {currentProject.name}
                </h3>
                {currentProject.description && (
                  <p className="text-body" style={{ color: "var(--text-secondary)", marginBottom: "6px" }}>
                    {currentProject.description}
                  </p>
                )}
                <span className="text-small" style={{ color: "var(--text-muted)" }}>
                  Created on {new Date(currentProject.createdAt).toLocaleDateString()} • {projectItems.length} items
                </span>
              </div>

              {/* Items in this project */}
              {projectItems.length === 0 ? (
                <EmptyState
                  icon="🏷️"
                  title="No items assigned to this project"
                  description="Assign any clipboard card to this project using the project dropdown on the card."
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {projectItems.map((item) => (
                    <ClipboardCard
                      key={item.id}
                      item={item}
                      projects={projects}
                      onCopy={onCopy}
                      onPin={onPin}
                      onDelete={onDelete}
                      onAssignProject={onAssignProject}
                      onOpenPreview={onOpenPreview}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Project Modal */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Project"
        description="Organize your clips into a dedicated topic or project workspace."
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", width: "100%" }}>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!newProjectName.trim() || isSubmitting}
              onClick={handleCreate}
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label htmlFor="project-name-input" className="text-small" style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
              Project Name *
            </label>
            <Input
              id="project-name-input"
              placeholder="e.g. Next.js Migration, Code Snippets"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="project-desc-input" className="text-small" style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
              Description (Optional)
            </label>
            <Input
              id="project-desc-input"
              placeholder="Brief description of what this project contains"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
};
