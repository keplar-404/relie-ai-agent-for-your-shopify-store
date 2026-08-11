"use client";

import type { ChatMessage } from "../types";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

interface ChatMessageListProps {
  messages: ChatMessage[];
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <main className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.map((msg) => (
        <Message key={msg.id} from={msg.role}>
          <MessageContent>
            <MessageResponse>{msg.text}</MessageResponse>
          </MessageContent>
        </Message>
      ))}
    </main>
  );
}
