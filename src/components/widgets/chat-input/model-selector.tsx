"use client";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { CheckIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { DEFAULT_MODELS, type ModelItemData } from "./models";
import { cn } from "@/lib/utils";

interface ModelItemProps {
  m: ModelItemData;
  selectedModel: string;
  selectedReasoning?: string;
  onSelect: (id: string, reasoning?: string) => void;
}

export const ModelItem = memo(({ m, selectedModel, selectedReasoning, onSelect }: ModelItemProps) => {
  const isSelected = selectedModel === m.id;
  const handleSelect = useCallback(() => onSelect(m.id), [onSelect, m.id]);

  return (
    <div className="flex flex-col w-full">
      <ModelSelectorItem
        key={m.id}
        onSelect={handleSelect}
        value={m.id}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer",
          isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
        )}
      >
        <ModelSelectorLogo provider={m.chefSlug} className="size-5 shrink-0" />
        <div className="flex flex-col flex-1 min-w-0">
          <ModelSelectorName className="font-semibold text-sm">{m.name}</ModelSelectorName>
          {isSelected && selectedReasoning && m.reasoningEfforts && m.reasoningEfforts.length > 0 && (
            <span className="text-xs text-muted-foreground mt-1">
              Active Reasoning: <span className="font-bold text-foreground capitalize">{selectedReasoning}</span>
            </span>
          )}
        </div>
        {isSelected ? (
          <CheckIcon className="ml-auto size-5 shrink-0 text-primary" />
        ) : (
          <div className="ml-auto size-5 shrink-0" />
        )}
      </ModelSelectorItem>

      {/* If selected and supports reasoning efforts, show pill choices */}
      {isSelected && m.reasoningEfforts && m.reasoningEfforts.length > 0 && (
        <div className="flex flex-col gap-2 pl-11 pr-3 py-2.5 bg-muted/40 border-t border-b border-border/50">
          <span className="text-xs text-muted-foreground font-bold tracking-wider capitalize">
            Select Reasoning Effort:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {m.reasoningEfforts.map((effort) => {
              const isEffortSelected = selectedReasoning === effort;
              return (
                <button
                  key={effort}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(m.id, effort);
                  }}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer capitalize shadow-xs",
                    isEffortSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground"
                  )}
                >
                  {effort}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

ModelItem.displayName = "ModelItem";

export interface ModelSelectorWidgetProps {
  value?: string;
  onValueChange?: (value: string) => void;
  selectedReasoning?: string;
  onReasoningChange?: (reasoning: string) => void;
  models?: ModelItemData[];
}

export function ModelSelectorWidget({
  value,
  onValueChange,
  selectedReasoning,
  onReasoningChange,
  models = DEFAULT_MODELS,
}: ModelSelectorWidgetProps) {
  const [internalModel, setInternalModel] = useState<string>(models[0]?.id || "");
  const [internalReasoning, setInternalReasoning] = useState<string>("");
  const [open, setOpen] = useState(false);

  const currentModelId = value ?? internalModel;
  const selectedModelData = models.find((m) => m.id === currentModelId) || models[0];

  // Set default reasoning effort when model changes if reasoning is supported
  const currentReasoning = selectedReasoning ?? internalReasoning ?? (selectedModelData?.reasoningEfforts?.[0] || "");

  const handleSelect = useCallback(
    (id: string, reasoning?: string) => {
      const modelData = models.find((m) => m.id === id);
      const defaultReasoning = reasoning ?? (modelData?.reasoningEfforts?.[0] || "");

      setInternalModel(id);
      setInternalReasoning(defaultReasoning);

      onValueChange?.(id);
      onReasoningChange?.(defaultReasoning);

      // Close only if we clicked a reasoning pill or if the model does not have reasoning efforts
      if (reasoning || !modelData?.reasoningEfforts || modelData.reasoningEfforts.length === 0) {
        setOpen(false);
      }
    },
    [onValueChange, onReasoningChange, models]
  );

  return (
    <ModelSelector open={open} onOpenChange={setOpen}>
      <ModelSelectorTrigger asChild>
        <PromptInputButton>
          {selectedModelData?.chefSlug && (
            <ModelSelectorLogo provider={selectedModelData.chefSlug} className="size-4" />
          )}
          {selectedModelData?.name && (
            <ModelSelectorName>
              {selectedModelData.name}
              {currentReasoning && selectedModelData.reasoningEfforts && selectedModelData.reasoningEfforts.length > 0 && (
                <span className="text-muted-foreground font-normal ml-1.5 text-[11px] capitalize">
                  ({currentReasoning})
                </span>
              )}
            </ModelSelectorName>
          )}
        </PromptInputButton>
      </ModelSelectorTrigger>
      <ModelSelectorContent className="sm:max-w-[480px] w-[95vw] max-h-[85vh]">
        <ModelSelectorInput placeholder="Search models..." className="py-4 text-base" />
        <ModelSelectorList className="max-h-[60vh] md:max-h-[500px]">
          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
          {Array.from(new Set(models.map((m) => m.chef))).map((chef) => {
            const chefModels = models.filter((m) => m.chef === chef);
            if (chefModels.length === 0) return null;
            return (
              <ModelSelectorGroup heading={chef} key={chef} className="p-2">
                {chefModels.map((m) => (
                  <ModelItem
                    key={m.id}
                    m={m}
                    onSelect={handleSelect}
                    selectedModel={currentModelId}
                    selectedReasoning={currentReasoning}
                  />
                ))}
              </ModelSelectorGroup>
            );
          })}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
