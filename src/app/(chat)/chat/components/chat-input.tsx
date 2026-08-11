"use client";

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionAddScreenshot,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { PromptInputAttachmentsDisplay } from "./prompt-attachments-display";
import type { ChatStatus } from "../types";

interface ChatInputProps {
  status: ChatStatus;
  onSubmit: (message: PromptInputMessage) => void;
}

export function ChatInput({ status, onSubmit }: ChatInputProps) {
  return (
    <footer className="p-4 border-t border-border bg-background">
      <PromptInput
        onSubmit={onSubmit}
        className="w-full"
        globalDrop
        multiple
      >
        <PromptInputHeader>
          <PromptInputAttachmentsDisplay />
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea
            placeholder="Ask follow-up questions..."
            className=""
          />
        </PromptInputBody>
        <PromptInputFooter className="">
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
    </footer>
  );
}
