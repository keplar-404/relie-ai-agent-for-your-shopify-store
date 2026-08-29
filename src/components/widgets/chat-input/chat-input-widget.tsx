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

function AttachButton() {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton type="button" onClick={() => attachments.openFileDialog()} tooltip="Attach files">
      <PaperclipIcon size={16} />
    </PromptInputButton>
  );
}

export interface ChatInputWidgetProps {
  status: "ready" | "submitted" | "streaming" | "error";
  onSubmit: (message: PromptInputMessage) => void;
  placeholder?: string;
  className?: string;
  showAttachments?: boolean;
  showModelSelector?: boolean;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  selectedReasoning?: string;
  onReasoningChange?: (reasoning: string) => void;
  models?: ModelItemData[];
  mode?: "ask" | "build";
  onModeChange?: (mode: "ask" | "build") => void;
}

export function ChatInputWidget({
  status,
  onSubmit,
  placeholder = "Ask anything about your store...",
  className = "w-full",
  showAttachments = true,
  showModelSelector = true,
  selectedModel,
  onModelChange,
  selectedReasoning,
  onReasoningChange,
  models,
  mode,
  onModeChange,
}: ChatInputWidgetProps) {
  return (
    <div className="size-full flex items-center justify-center">
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
            <PromptInputBody>
              <PromptInputTextarea
                placeholder={placeholder}
                className="p-4"
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <AttachButton />

                {showModelSelector && (
                  <ModelSelectorWidget
                    value={selectedModel}
                    onValueChange={onModelChange}
                    selectedReasoning={selectedReasoning}
                    onReasoningChange={onReasoningChange}
                    models={models}
                  />
                )}
              </PromptInputTools>
              <div className="flex items-center gap-2">
                {mode && onModeChange && (
                  <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-lg border border-border h-8">
                    <button
                      type="button"
                      onClick={() => onModeChange("ask")}
                      className={cn(
                        "px-2.5 h-full text-xs font-semibold rounded-md transition-all cursor-pointer",
                        mode === "ask"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Ask
                    </button>
                    <button
                      type="button"
                      onClick={() => onModeChange("build")}
                      className={cn(
                        "px-2.5 h-full text-xs font-semibold rounded-md transition-all cursor-pointer",
                        mode === "build"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Build
                    </button>
                  </div>
                )}
                <PromptInputSubmit status={status} />
              </div>
            </PromptInputFooter>
          </PromptInput>
        </PromptInputProvider>
      </TooltipProvider>
    </div>
  );
}

