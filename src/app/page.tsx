"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatInputWidget } from "@/components/widgets/chat-input";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"ask" | "build">("ask");
  const [selectedModel, setSelectedModel] = useState<string>("openrouter/free");
  const [selectedReasoning, setSelectedReasoning] = useState<string>("");

  const handleSearchSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim();
    if (!text) return;
    router.push(`/chat/session?q=${encodeURIComponent(text)}&mode=${mode}&model=${encodeURIComponent(selectedModel)}&reasoning=${encodeURIComponent(selectedReasoning)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background px-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Relie AI Agent</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Ask anything to start chatting with your AI Assistant
          </p>
        </div>

        <div className="w-full">
          <ChatInputWidget
            status="ready"
            onSubmit={handleSearchSubmit}
            placeholder="Ask anything about your store..."
            mode={mode}
            onModeChange={setMode}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            selectedReasoning={selectedReasoning}
            onReasoningChange={setSelectedReasoning}
          />
        </div>
      </div>
    </div>
  );
}
