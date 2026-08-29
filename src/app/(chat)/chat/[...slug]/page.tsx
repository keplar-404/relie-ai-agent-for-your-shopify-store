"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatPreviewPanel } from "@/features/userChat/components/chat-preview-panel";
import { ChatContent } from "@/features/userChat";

export default function ChatPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const hasCalled = useRef(false);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const isAskMode = mode === "ask";

  useEffect(() => {
    if (isAskMode || hasCalled.current) return;
    hasCalled.current = true;

    fetch("/api/sandbox", { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.previewUrl) setPreviewUrl(data.previewUrl);
      })
      .catch((err) => {
        console.error("Sandbox provision error:", err);
      });
  }, [isAskMode]);

  if (isAskMode) {
    return (
      <div className="h-full w-full bg-background flex flex-col">
        <ChatContent />
      </div>
    );
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      {/* Left Panel: Chat Interface */}
      <ResizablePanel
        defaultSize={"20%"}
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


