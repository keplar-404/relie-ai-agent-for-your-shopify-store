import { create } from "zustand";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";

export interface ChatStoreState {
  sandboxId: string | null;
  selectedModel: string;
  selectedReasoning: string;
  pendingMessage: PromptInputMessage | null;
  setSandboxId: (sandboxId: string | null) => void;
  setSelectedModel: (model: string) => void;
  setSelectedReasoning: (reasoning: string) => void;
  setPendingMessage: (message: PromptInputMessage | null) => void;
  consumePendingMessage: () => PromptInputMessage | null;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  sandboxId: null,
  selectedModel: "openrouter/auto",
  selectedReasoning: "",
  pendingMessage: null,
  setSandboxId: (sandboxId) => set({ sandboxId }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setSelectedReasoning: (selectedReasoning) => set({ selectedReasoning }),
  setPendingMessage: (pendingMessage) => set({ pendingMessage }),
  consumePendingMessage: () => {
    const pending = get().pendingMessage;
    if (pending) {
      set({ pendingMessage: null });
    }
    return pending;
  },
}));
