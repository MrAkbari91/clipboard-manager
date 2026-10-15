import { useMemo } from "react";
import { ClipboardBrainAPI } from "../shared/clipboard-contract";
import { createMockClipboardAPI } from "../adapters/mock-clipboard-api";

let mockInstance: ClipboardBrainAPI | null = null;

export function useClipboardBrain(): {
  api: ClipboardBrainAPI;
  isNativeElectron: boolean;
} {
  return useMemo(() => {
    if (typeof window !== "undefined" && window.clipboardBrain) {
      return {
        api: window.clipboardBrain,
        isNativeElectron: true,
      };
    }

    // Fallback for development/testing in standard browser
    if (!mockInstance) {
      mockInstance = createMockClipboardAPI();
    }

    return {
      api: mockInstance,
      isNativeElectron: false,
    };
  }, []);
}
