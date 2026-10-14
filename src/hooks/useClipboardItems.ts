import { useState, useEffect, useCallback, useRef } from "react";
import { ClipboardItem, ClipboardQuery } from "../shared/clipboard-contract";
import { useClipboardBrain } from "./useClipboardBrain";

export function useClipboardItems(initialQuery: ClipboardQuery = {}) {
  const { api } = useClipboardBrain();
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [query, setQuery] = useState<ClipboardQuery>({
    sort: "newest",
    contentType: "all",
    ...initialQuery,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track latest request to avoid race conditions from stale responses
  const activeRequestId = useRef<number>(0);

  const fetchItems = useCallback(async (currentQuery: ClipboardQuery) => {
    const requestId = ++activeRequestId.current;
    setLoading(true);
    setError(null);

    try {
      const sanitizedQuery: ClipboardQuery = {
        ...currentQuery,
        search: currentQuery.search?.trim() ? currentQuery.search.trim() : undefined,
        contentType: currentQuery.contentType === "all" ? undefined : currentQuery.contentType,
        pinnedOnly: currentQuery.pinnedOnly ? true : undefined,
      };

      const result = await api.getItems(sanitizedQuery);

      // Only update state if this is still the most recent request
      if (requestId === activeRequestId.current) {
        setItems(result);
        setLoading(false);
      }
    } catch (err: any) {
      if (requestId === activeRequestId.current) {
        setError(err.message || "Failed to load clipboard items");
        setLoading(false);
      }
    }
  }, [api]);

  // Re-fetch whenever query changes
  useEffect(() => {
    fetchItems(query);
  }, [fetchItems, query]);

  // Subscribe to live new item additions from Electron clipboard monitor
  useEffect(() => {
    const unsubscribe = api.onItemAdded((newItem) => {
      setItems((prev) => {
        // If sorting newest first and item matches current filter, prepend it
        const exists = prev.some((i) => i.id === newItem.id);
        if (exists) {
          return prev.map((i) => (i.id === newItem.id ? newItem : i));
        }

        // If filtering by type and doesn't match, or pinned only and not pinned, ignore
        if (query.contentType && query.contentType !== "all" && newItem.contentType !== query.contentType) {
          return prev;
        }
        if (query.pinnedOnly && !newItem.isPinned) {
          return prev;
        }
        if (query.projectId && newItem.projectId !== query.projectId) {
          return prev;
        }

        return [newItem, ...prev];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [api, query]);

  const copyItem = async (id: string): Promise<boolean> => {
    try {
      const res = await api.copyItem(id);
      return res.success;
    } catch (err: any) {
      setError(err.message || "Failed to copy item");
      return false;
    }
  };

  const pinItem = async (id: string, isPinned: boolean): Promise<boolean> => {
    try {
      const updated = await api.pinItem(id, isPinned);
      setItems((prev) =>
        prev
          .map((item) => (item.id === id ? updated : item))
          .filter((item) => (query.pinnedOnly ? item.isPinned : true))
      );
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update pin status");
      return false;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      const res = await api.deleteItem(id);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || "Failed to delete item");
      return false;
    }
  };

  const clearHistory = async (): Promise<number> => {
    try {
      const res = await api.clearHistory();
      setItems([]);
      return res.deletedCount;
    } catch (err: any) {
      setError(err.message || "Failed to clear history");
      return 0;
    }
  };

  const assignProject = async (itemId: string, projectId: string | null): Promise<boolean> => {
    try {
      const updated = await api.assignProject(itemId, projectId);
      setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to assign project");
      return false;
    }
  };

  const updateSearch = (search: string) => {
    setQuery((prev) => ({ ...prev, search }));
  };

  const updateContentType = (contentType: ClipboardQuery["contentType"]) => {
    setQuery((prev) => ({ ...prev, contentType }));
  };

  const updatePinnedOnly = (pinnedOnly: boolean) => {
    setQuery((prev) => ({ ...prev, pinnedOnly }));
  };

  const updateSort = (sort: "newest" | "oldest") => {
    setQuery((prev) => ({ ...prev, sort }));
  };

  const updateProjectId = (projectId: string | null | undefined) => {
    setQuery((prev) => ({ ...prev, projectId }));
  };

  const resetFilters = () => {
    setQuery({
      search: "",
      contentType: "all",
      pinnedOnly: false,
      projectId: undefined,
      sort: "newest",
    });
  };

  return {
    items,
    query,
    loading,
    error,
    refresh: () => fetchItems(query),
    updateSearch,
    updateContentType,
    updatePinnedOnly,
    updateSort,
    updateProjectId,
    resetFilters,
    copyItem,
    pinItem,
    deleteItem,
    clearHistory,
    assignProject,
    clearError: () => setError(null),
  };
}
