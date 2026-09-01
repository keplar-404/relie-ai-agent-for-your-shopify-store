"use client";

import { useRouter } from "next/navigation";
import { ChatInputWidget } from "@/components/widgets/chat-input";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useChatStore } from "@/stores/use-chat-store";

export default function Home() {
  const router = useRouter();

  const selectedModel = useChatStore((state) => state.selectedModel);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);
  const selectedReasoning = useChatStore((state) => state.selectedReasoning);
  const setSelectedReasoning = useChatStore((state) => state.setSelectedReasoning);
  const setPendingMessage = useChatStore((state) => state.setPendingMessage);

  const handleSearchSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim();
    const hasFiles = Boolean(message.files?.length);
    if (!text && !hasFiles) return;

    // Save initial prompt and files in Zustand store
    setPendingMessage(message);

    // Generate unique session UUID slug
    const chatId = crypto.randomUUID();
    router.push(`/chat/${chatId}`);
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
