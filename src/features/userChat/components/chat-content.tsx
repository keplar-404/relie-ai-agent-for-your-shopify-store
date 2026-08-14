"use client";

import { useShopifyChat } from "../hooks/use-shopify-chat";
import { ChatHeader } from "./chat-header";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";

export function ChatContent() {
  const { messages, status, handleSubmit } = useShopifyChat();

  return (
    <>
      <ChatHeader />
      <ChatMessageList messages={messages} />
      <ChatInput status={status} onSubmit={handleSubmit} />
    </>
  );
}

