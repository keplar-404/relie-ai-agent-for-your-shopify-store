"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { ChatInputWidget } from "@/components/widgets/chat-input";
import type { ChatStatus } from "../types";

interface ChatInputProps {
  status: ChatStatus;
  onSubmit: (message: PromptInputMessage) => void;
}

export function ChatInput({ status, onSubmit }: ChatInputProps) {
  return (
    <footer className="p-4 border-t border-border bg-background">
      <ChatInputWidget
        status={status}
        onSubmit={onSubmit}
        placeholder="Ask follow-up questions..."
      />
    </footer>
  );
}

