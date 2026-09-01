"use client";

import { useEffect, useState, useRef } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatPreviewPanel } from "@/features/userChat/components/chat-preview-panel";
import { ChatContent } from "@/features/userChat";
import { useChatStore } from "@/stores/use-chat-store";

export default function ChatPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const hasCalled = useRef(false);
  const setSandboxId = useChatStore((state) => state.setSandboxId);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    fetch("/api/sandbox", { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.previewUrl) setPreviewUrl(data.previewUrl);
        if (data?.sandboxId) setSandboxId(data.sandboxId);
      })
      .catch((err) => {
        console.error("Sandbox provision error:", err);
      });
  }, [setSandboxId]);

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      {/* Left Panel: Chat Interface */}
      <ResizablePanel
        defaultSize={"40%"}
        minSize={"20%"}
        maxSize={"60%"}
        className="flex flex-col h-full bg-background border-r border-border"
      >
        <ChatContent />
      </ResizablePanel>

      <ResizableHandle withHandle className="after:w-4" />

      {/* Right Panel: Web Preview & Code View */}
      <ResizablePanel className="hidden md:flex flex-col h-full bg-background">
        <ChatPreviewPanel initialUrl={previewUrl} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
