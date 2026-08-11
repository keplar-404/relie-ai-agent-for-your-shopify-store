"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useShopifyChat } from "../hooks/use-shopify-chat";
import { ChatHeader } from "./chat-header";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";

export function ChatContent() {
  const { messages, status, handleSubmit } = useShopifyChat();

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      {/* Left Panel: Chat Interface */}
      <ResizablePanel
        defaultSize={"20%"}
        minSize={"20%"}
        maxSize={"60%"}
        className="flex flex-col h-full bg-background border-r border-border"
      >
        <ChatHeader />
        <ChatMessageList messages={messages} />
        <ChatInput status={status} onSubmit={handleSubmit} />
      </ResizablePanel>

      <ResizableHandle withHandle className="after:w-4" />

      {/* Right Panel: Empty Section */}
      <ResizablePanel className="hidden md:flex flex-col h-full bg-muted/10">
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          {/* Empty right panel section */}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
