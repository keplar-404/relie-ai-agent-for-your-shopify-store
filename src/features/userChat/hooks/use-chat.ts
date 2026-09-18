"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useChatStore } from "@/stores/use-chat-store";
import {
  buildAttachmentMap,
  formatAttachmentMapMessage,
  type ProcessedAttachment,
} from "@/services/attachmentProcessor/attachmentMap";

function showRateOrLimitToast(errorMsg: string) {
  const msgLower = errorMsg.toLowerCase();

  if (
    msgLower.includes("rate limit") ||
    msgLower.includes("429") ||
    msgLower.includes("too many requests") ||
    msgLower.includes("throttled")
  ) {
    toast.error("Rate Limit Exceeded", {
      description: "You have reached the rate limit for this AI model. Please wait a few seconds before trying again.",
      duration: 8000,
    });
  } else if (
    msgLower.includes("api key") ||
    msgLower.includes("quota") ||
    msgLower.includes("credit") ||
    msgLower.includes("afford") ||
    msgLower.includes("requested up to") ||
    msgLower.includes("payment required") ||
    msgLower.includes("401") ||
    msgLower.includes("402") ||
    msgLower.includes("403") ||
    msgLower.includes("unauthorized") ||
    msgLower.includes("insufficient")
  ) {
    toast.error("API Key / Credit Limit Reached", {
      description: "Your API key or credit balance has run out. Please check your OpenRouter credits or spending limits.",
      duration: 10000,
    });
  } else if (
    msgLower.includes("token") ||
    msgLower.includes("context_length_exceeded") ||
    msgLower.includes("context window") ||
    msgLower.includes("maximum context length") ||
    msgLower.includes("max_tokens") ||
    msgLower.includes("413")
  ) {
    toast.error("Token Limit Reached", {
      description: "The prompt or requested max_tokens exceeded the token capacity limit for this model.",
      duration: 8000,
    });
  } else {
    toast.error("AI Generation Error", {
      description: errorMsg || "An unexpected error occurred during the session.",
      duration: 6000,
    });
  }
}

export function useChatSession() {
  const params = useParams();
  const rawSlug = params?.slug;
  const projectId = Array.isArray(rawSlug) ? rawSlug[0] : typeof rawSlug === "string" ? rawSlug : "";

  const sandboxId = useChatStore((state) => state.sandboxId);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);
  const selectedReasoning = useChatStore((state) => state.selectedReasoning);
  const setSelectedReasoning = useChatStore((state) => state.setSelectedReasoning);
  const consumePendingMessage = useChatStore((state) => state.consumePendingMessage);

  // Memoize transport so updated sandboxId, model, reasoning, and thread/chatId are passed in body
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent",
        body: {
          sandboxId,
          model: selectedModel,
          reasoning: selectedReasoning,
          chatId: projectId || undefined,
          threadId: projectId || undefined,
        },
      }),
    [sandboxId, selectedModel, selectedReasoning, projectId],
  );

  // Initialize Vercel AI SDK useChat hook with DefaultChatTransport
  const { messages, sendMessage, status, stop, error: chatError } = useChat({
    transport,
    onFinish: ({ message }) => {
      console.log("🤖 [AI AGENT RESPONSE RECEIVED IN BROWSER]:", message);
    },
    onError: (error) => {
      console.error("Chat streaming error:", error);
      showRateOrLimitToast(error.message || String(error));
    },
  });

  // Watch for useChat error object
  useEffect(() => {
    if (chatError) {
      console.error("useChat error state caught:", chatError);
      showRateOrLimitToast(chatError.message || String(chatError));
    }
  }, [chatError]);

  // Detect streamed error messages (e.g. rate limit, quota, token limits) in message stream
  const lastToastErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant") {
      let text = typeof (lastMsg as any).content === "string" ? (lastMsg as any).content : "";
      if (Array.isArray(lastMsg.parts)) {
        text += " " + lastMsg.parts.map((p) => (typeof p === "string" ? p : "text" in p && typeof p.text === "string" ? p.text : "")).join(" ");
      }
      if (text.includes("⚠️ **Server Error**:") && lastToastErrorRef.current !== text) {
        lastToastErrorRef.current = text;
        const extractedMsg = text.split("⚠️ **Server Error**:")[1]?.split("\n")[0]?.trim() || text;
        showRateOrLimitToast(extractedMsg);
      }
    }
  }, [messages]);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text?.trim() || "";
      const files = message.files || [];

      if (!text && files.length === 0) return;

      if (files.length === 0) {
        sendMessage({ text });
        return;
      }

      const toastId = toast.loading(
        `Uploading & processing ${files.length} attachment${files.length > 1 ? "s" : ""}...`
      );

      try {
        const uploadPromises = files.map(async (fileItem, index) => {
          let fileBlob: Blob;
          if (fileItem.url) {
            const res = await fetch(fileItem.url);
            fileBlob = await res.blob();
          } else {
            throw new Error(`File ${fileItem.filename || index} has no accessible data`);
          }

          const file = new File(
            [fileBlob],
            fileItem.filename || `attachment_${index}`,
            {
              type: fileItem.mediaType || fileBlob.type || "application/octet-stream",
            }
          );

          const formData = new FormData();
          formData.append("file", file);
          formData.append("projectId", projectId || "default");
          formData.append("chatId", projectId || "");
          formData.append("orderIndex", String(index));

          const res = await fetch("/api/attachments/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(
              errData.error || `Upload failed with HTTP ${res.status}`
            );
          }

          return (await res.json()) as ProcessedAttachment;
        });

        const processedResults = await Promise.all(uploadPromises);
        const attachmentMap = buildAttachmentMap(processedResults);
        const enrichedText = formatAttachmentMapMessage(text, attachmentMap);

        toast.success("Attachments processed successfully", {
          id: toastId,
          duration: 2500,
        });

        sendMessage({
          text: enrichedText,
        });
      } catch (err: any) {
        console.error("Attachment upload error:", err);
        toast.error("Attachment processing failed", {
          id: toastId,
          description: err.message || "Failed to process attached files",
          duration: 6000,
        });
      }
    },
    [projectId, sendMessage],
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
    stop,
    handleSubmit,
    selectedModel,
    setSelectedModel,
    selectedReasoning,
    setSelectedReasoning,
  };
}
