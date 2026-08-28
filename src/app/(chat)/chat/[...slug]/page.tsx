"use client";

import { useEffect, useState, useRef } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatPreviewPanel } from "@/features/userChat/components/chat-preview-panel";
import { ChatContent } from "@/features/userChat";
import { provisionSandbox } from "@/lib/api";

export default function ChatPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;
    
    provisionSandbox()
      .then((data) => {
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

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
