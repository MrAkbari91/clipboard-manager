import { useState, useEffect, useCallback } from "react";
import { Project } from "../shared/clipboard-contract";
import { useClipboardBrain } from "./useClipboardBrain";

export function useProjects() {
  const { api } = useClipboardBrain();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getProjects();
      setProjects(list);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string, description?: string): Promise<Project | null> => {
    if (!name.trim()) return null;
    try {
      const newProj = await api.createProject({ name: name.trim(), description: description?.trim() });
      setProjects((prev) => [...prev, newProj]);
      return newProj;
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      return null;
    }
  };

  return {
    projects,
    loading,
    error,
    refresh: fetchProjects,
    createProject,
    clearError: () => setError(null),
  };
}
