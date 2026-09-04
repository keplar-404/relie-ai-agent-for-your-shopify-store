"use client";

import { useChatSession } from "../hooks/use-chat";
import { ChatHeader } from "./chat-header";
import { ChatMessageList } from "./chat-message-list";
import { ChatInputWidget } from "@/components/widgets/chat-input";

export function ChatContent() {
  const {
    messages,
    status,
    stop,
    handleSubmit,
    selectedModel,
    setSelectedModel,
    selectedReasoning,
    setSelectedReasoning,
  } = useChatSession();

  return (
    <>
      <ChatHeader />
      <ChatMessageList messages={messages} />
      <footer className="p-4 border-t border-border bg-background">
        <ChatInputWidget
          status={status}
          onStop={stop}
          onSubmit={handleSubmit}
          placeholder="Ask follow-up questions..."
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          selectedReasoning={selectedReasoning}
          onReasoningChange={setSelectedReasoning}
        />
      </footer>
    </>
  );
}
