"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";

const DEFAULT_INITIAL_QUERY = "Hello! How can you help me today?";

export function useChatSession() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || DEFAULT_INITIAL_QUERY;
  const initialMode = (searchParams.get("mode") as "ask" | "build") || "ask";
  const initialModel = searchParams.get("model") || "openrouter/free";
  const initialReasoning = searchParams.get("reasoning") || "";

  const [mode, setMode] = useState<"ask" | "build">(initialMode);
  const [selectedModel, setSelectedModel] = useState<string>(initialModel);
  const [selectedReasoning, setSelectedReasoning] = useState<string>(initialReasoning);

  // Initialize Vercel AI SDK useChat hook with HttpChatTransport
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        model: selectedModel,
        reasoning: selectedReasoning,
      },
    }),
    onError: (error) => {
      console.error("Chat streaming error:", error);
      toast.error(error.message || "An unexpected error occurred during the session.");
    },
  });

  const handleSubmit = useCallback((message: PromptInputMessage) => {
    const text = message.text?.trim() || "";
    const hasAttachments = Boolean(message.files?.length);

    if (!text && !hasAttachments) return;

    // Use built-in sendMessage helper from the AI SDK
    sendMessage({
      text,
      files: message.files || [],
    });
  }, [sendMessage]);

  // Automatically submit initial query on mount if present
  const hasTriggeredInitial = useRef(false);
  useEffect(() => {
    if (initialQuery && !hasTriggeredInitial.current) {
      hasTriggeredInitial.current = true;
      handleSubmit({ text: initialQuery, files: [] });
    }
  }, [initialQuery, handleSubmit]);

  return {
    messages,
    status,
    handleSubmit,
    mode,
    setMode,
    selectedModel,
    setSelectedModel,
    selectedReasoning,
    setSelectedReasoning,
  };
}

