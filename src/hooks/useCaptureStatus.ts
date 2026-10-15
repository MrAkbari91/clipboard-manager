import { useState, useEffect, useCallback } from "react";
import { useClipboardBrain } from "./useClipboardBrain";

export function useCaptureStatus() {
  const { api } = useClipboardBrain();
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.getCaptureStatus();
      setIsPaused(res.isPaused);
    } catch (err: any) {
      setError(err.message || "Failed to load capture status");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const toggleCapture = async (): Promise<boolean> => {
    try {
      const res = await api.setCapturePaused(!isPaused);
      setIsPaused(res.isPaused);
      return res.isPaused;
    } catch (err: any) {
      setError(err.message || "Failed to toggle capture status");
      return isPaused;
    }
  };

  return {
    isPaused,
    loading,
    error,
    toggleCapture,
    refresh: fetchStatus,
    clearError: () => setError(null),
  };
}
