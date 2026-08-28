"use client";

import { useRouter } from "next/navigation";
import { ChatInputWidget } from "@/components/widgets/chat-input";

export default function Home() {
  const router = useRouter();

  const handleSearchSubmit = (message: any) => {
    const text = message.text?.trim();
    if (!text) return;
    const id = Date.now().toString();
    router.push(`/chat/${id}?q=${encodeURIComponent(text)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background px-4">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Relie AI Agent</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Ask anything to start chatting with your Shopify AI Assistant
          </p>
        </div>

        <div className="w-full">
          <ChatInputWidget
            status="ready"
            onSubmit={handleSearchSubmit}
            placeholder="Ask anything about your store..."
          />
        </div>
      </div>
    </div>
  );
}
