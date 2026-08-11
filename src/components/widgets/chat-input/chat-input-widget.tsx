"use client";

import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PaperclipIcon } from "lucide-react";
import { ModelSelectorWidget } from "./model-selector";
import { PromptInputAttachmentsDisplay } from "./prompt-attachments-display";
import type { ModelItemData } from "./models";
import { cn } from "@/lib/utils";

function PromptInputAttachButton() {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton
      type="button"
      onClick={() => attachments.openFileDialog()}
      tooltip="Attach files"


    >
      <PaperclipIcon size={16} />
    </PromptInputButton>
  );
}

export interface ChatInputWidgetProps {
  status: "ready" | "submitted" | "streaming" | "error";
  onSubmit: (message: PromptInputMessage) => void;
  placeholder?: string;
  className?: string;
  bodyClassName?: string;
  textareaClassName?: string;
  footerClassName?: string;
  showAttachments?: boolean;
  showModelSelector?: boolean;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  models?: ModelItemData[];
}

export function ChatInputWidget({
  status,
  onSubmit,
  placeholder = "Ask anything about your store...",
  className = "w-full",
  bodyClassName,
  textareaClassName,
  footerClassName,
  showAttachments = true,
  showModelSelector = true,
  selectedModel,
  onModelChange,
  models,
}: ChatInputWidgetProps) {
  return (
    <div className="size-full">
      <TooltipProvider>
        <PromptInputProvider>
          <PromptInput
            onSubmit={onSubmit}
            className={className}
            globalDrop
            multiple
            accept="image/*,application/pdf"

          >
            {showAttachments && <PromptInputAttachmentsDisplay />}
            <PromptInputBody className={bodyClassName}>
              <PromptInputTextarea
                placeholder={placeholder}
                className={cn("p-4", textareaClassName)}
              />
            </PromptInputBody>
            <PromptInputFooter className={footerClassName}>
              <PromptInputTools>
                <PromptInputAttachButton />

                {showModelSelector && (
                  <ModelSelectorWidget
                    value={selectedModel}
                    onValueChange={onModelChange}
                    models={models}
                  />
                )}
              </PromptInputTools>
              <PromptInputSubmit status={status} />
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </TooltipProvider>
    </div>
  );
}

