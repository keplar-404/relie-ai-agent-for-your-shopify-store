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
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { CheckIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { DEFAULT_MODELS, MODEL_CHEFS, type ModelItemData } from "./models";

interface ModelItemProps {
  m: ModelItemData;
  selectedModel: string;
  onSelect: (id: string) => void;
}

export const ModelItem = memo(({ m, selectedModel, onSelect }: ModelItemProps) => {
  const handleSelect = useCallback(() => onSelect(m.id), [onSelect, m.id]);
  return (
    <ModelSelectorItem key={m.id} onSelect={handleSelect} value={m.id}>
      <ModelSelectorLogo provider={m.chefSlug} />
      <ModelSelectorName>{m.name}</ModelSelectorName>
      <ModelSelectorLogoGroup>
        {m.providers.map((provider) => (
          <ModelSelectorLogo key={provider} provider={provider} />
        ))}
      </ModelSelectorLogoGroup>
      {selectedModel === m.id ? (
        <CheckIcon className="ml-auto size-4" />
      ) : (
        <div className="ml-auto size-4" />
      )}
    </ModelSelectorItem>
  );
});

ModelItem.displayName = "ModelItem";

export interface ModelSelectorWidgetProps {
  value?: string;
  onValueChange?: (value: string) => void;
  models?: ModelItemData[];
}

export function ModelSelectorWidget({
  value,
  onValueChange,
  models = DEFAULT_MODELS,
}: ModelSelectorWidgetProps) {
  const [internalModel, setInternalModel] = useState<string>(models[0]?.id || "");
  const [open, setOpen] = useState(false);

  const currentModelId = value ?? internalModel;
  const selectedModelData = models.find((m) => m.id === currentModelId) || models[0];

  const handleSelect = useCallback(
    (id: string) => {
      setInternalModel(id);
      onValueChange?.(id);
      setOpen(false);
    },
    [onValueChange]
  );

  return (
    <ModelSelector open={open} onOpenChange={setOpen}>
      <ModelSelectorTrigger asChild>
        <PromptInputButton>
          {selectedModelData?.chefSlug && (
            <ModelSelectorLogo provider={selectedModelData.chefSlug} />
          )}
          {selectedModelData?.name && (
            <ModelSelectorName>{selectedModelData.name}</ModelSelectorName>
          )}
        </PromptInputButton>
      </ModelSelectorTrigger>
      <ModelSelectorContent className="sm:max-w-[420px] w-[90vw]">
        <ModelSelectorInput placeholder="Search models..." />
        <ModelSelectorList>
          <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
          {MODEL_CHEFS.map((chef) => {
            const chefModels = models.filter((m) => m.chef === chef);
            if (chefModels.length === 0) return null;
            return (
              <ModelSelectorGroup heading={chef} key={chef}>
                {chefModels.map((m) => (
                  <ModelItem
                    key={m.id}
                    m={m}
                    onSelect={handleSelect}
                    selectedModel={currentModelId}
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
