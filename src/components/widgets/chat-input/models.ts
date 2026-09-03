export interface ModelItemData {
  chef: string;
  chefSlug: string;
  id: string;
  name: string;
  providers: string[];
  reasoningEfforts?: string[];
}

export const DEFAULT_MODELS: ModelItemData[] = [
  {
    chef: "OpenRouter",
    chefSlug: "openrouter",
    id: "openrouter/auto",
    name: "OpenRouter Auto (Paid Balance)",
    providers: ["openrouter"],
  },
  {
    chef: "OpenRouter",
    chefSlug: "openrouter",
    id: "openrouter/free",
    name: "OpenRouter Free Models (50 msgs/day)",
    providers: ["openrouter"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    providers: ["openrouter"],
    reasoningEfforts: ["minimal", "low", "medium", "high"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    providers: ["openrouter"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    providers: ["openrouter"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    providers: ["openrouter"],
  },
  {
    chef: "DeepSeek",
    chefSlug: "deepseek",
    id: "deepseek/deepseek-v4-flash-0731:batch",
    name: "DeepSeek V4 Flash Batch",
    providers: ["openrouter"],
  },
  {
    chef: "Z-AI",
    chefSlug: "z-ai",
    id: "z-ai/glm-5.2",
    name: "GLM 5.2",
    providers: ["openrouter"],
  },
];
