"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useChatStore } from "@/stores/use-chat-store";

export function useChatSession() {
  const sandboxId = useChatStore((state) => state.sandboxId);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);
  const selectedReasoning = useChatStore((state) => state.selectedReasoning);
  const setSelectedReasoning = useChatStore((state) => state.setSelectedReasoning);
  const consumePendingMessage = useChatStore((state) => state.consumePendingMessage);

  // Memoize transport so updated sandboxId, model, and reasoning are passed in body
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent",
        body: {
          sandboxId,
          model: selectedModel,
          reasoning: selectedReasoning,
        },
      }),
    [sandboxId, selectedModel, selectedReasoning],
  );

  // Initialize Vercel AI SDK useChat hook with DefaultChatTransport
  const { messages, sendMessage, status } = useChat({
    transport,
    onFinish: ({ message }) => {
      console.log("🤖 [AI AGENT RESPONSE RECEIVED IN BROWSER]:", message);
    },
    onError: (error) => {
      console.error("Chat streaming error:", error);
      toast.error(error.message || "An unexpected error occurred during the session.");
    },
  });

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const text = message.text?.trim() || "";
      const hasAttachments = Boolean(message.files?.length);

      if (!text && !hasAttachments) return;

      sendMessage({
        text,
        files: message.files || [],
      });
    },
    [sendMessage],
  );

  // Auto-send initial pending message from Zustand store once sandboxId is provisioned
  const hasTriggeredInitial = useRef(false);
  useEffect(() => {
    if (hasTriggeredInitial.current) return;

    const pending = useChatStore.getState().pendingMessage;
    const activeSandbox = useChatStore.getState().sandboxId;

    if (pending && activeSandbox) {
      hasTriggeredInitial.current = true;
      consumePendingMessage();
      handleSubmit(pending);
    } else if (pending && !activeSandbox) {
      // Fallback: trigger after 3s if sandbox provision is delayed
      const timer = setTimeout(() => {
        if (!hasTriggeredInitial.current) {
          hasTriggeredInitial.current = true;
          consumePendingMessage();
          handleSubmit(pending);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sandboxId, consumePendingMessage, handleSubmit]);

  return {
    messages,
    status,
    handleSubmit,
    selectedModel,
    setSelectedModel,
    selectedReasoning,
    setSelectedReasoning,
  };
}
