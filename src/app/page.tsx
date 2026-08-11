"use client";

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const SUBMITTING_TIMEOUT = 200;

type HomeSubmitStatus = "submitted" | "streaming" | "ready" | "error";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<HomeSubmitStatus>("ready");

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const text = message.text?.trim();
      const hasAttachments = Boolean(message.files?.length);

      if (!text && !hasAttachments) return;

      setStatus("submitted");
      setTimeout(() => {
        router.push(`/chat?q=${encodeURIComponent(text || "Attachments")}`);
      }, SUBMITTING_TIMEOUT);
    },
    [router]
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background px-4">
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Relie AI Agent</h1>
        <p className="text-muted-foreground text-sm max-w-md">
          Ask anything to start chatting with your Shopify AI Assistant
        </p>
      </div>

      <PromptInput
        onSubmit={handleSubmit}
        className="w-full max-w-[750px] bg-card border border-border rounded-xl shadow-xs p-3 flex flex-col gap-2 transition-all focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20"
        globalDrop
        multiple
      >
        <PromptInputBody className="w-full">
          <PromptInputTextarea
            placeholder="Ask anything about your store..."
            className="w-full min-h-[60px] max-h-[180px] bg-transparent border-0 outline-none focus:ring-0 resize-none font-sans text-sm text-foreground placeholder:text-muted-foreground"
          />
        </PromptInputBody>
        <PromptInputFooter className="flex items-center justify-between border-t border-border/50 pt-2">
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
                <PromptInputActionAddScreenshot />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>
          <PromptInputSubmit status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
