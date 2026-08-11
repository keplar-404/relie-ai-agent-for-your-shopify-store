"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ChatMessage, ChatStatus } from "../types";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";

const STREAMING_START_TIMEOUT = 300;
const RESPONSE_COMPLETE_TIMEOUT = 1500;
const DEFAULT_INITIAL_QUERY = "How can I optimize my Shopify store conversions?";

export function useShopifyChat() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || DEFAULT_INITIAL_QUERY;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "user",
      text: initialQuery,
    },
    {
      id: "2",
      role: "assistant",
      text: "I've analyzed your Shopify store setup. Here are 3 key recommendations to boost your conversions:\n\n1. **Optimize Product Page Load Times** - Reduce image bundle sizes and defer non-critical scripts.\n2. **Streamline Checkout** - Enable 1-click checkout options like Shop Pay and Apple Pay.\n3. **Smart Product Recommendations** - Display personalized cross-sells on product and cart pages.",
    },
  ]);

  const [status, setStatus] = useState<ChatStatus>("ready");

  const handleSubmit = useCallback((message: PromptInputMessage) => {
    const text = message.text?.trim();
    const hasAttachments = Boolean(message.files?.length);

    if (!text && !hasAttachments) return;

    const userMessageId = Date.now().toString();
    const messageText = text || (hasAttachments ? "[Attachments uploaded]" : "");
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      text: messageText,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setStatus("submitted");

    // Simulate response sequence: submitted -> streaming -> ready
    const streamingTimer = setTimeout(() => {
      setStatus("streaming");
    }, STREAMING_START_TIMEOUT);

    const completionTimer = setTimeout(() => {
      const aiMessageId = (Date.now() + 1).toString();
      const newAiMessage: ChatMessage = {
        id: aiMessageId,
        role: "assistant",
        text: "Thanks for asking! I am processing your request and generating detailed insights for your Shopify store.",
      };
      setMessages((prev) => [...prev, newAiMessage]);
      setStatus("ready");
    }, RESPONSE_COMPLETE_TIMEOUT);

    return () => {
      clearTimeout(streamingTimer);
      clearTimeout(completionTimer);
    };
  }, []);

  return {
    messages,
    status,
    handleSubmit,
  };
}
