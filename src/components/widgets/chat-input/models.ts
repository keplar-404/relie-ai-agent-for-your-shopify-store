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
    name: "Gemini 3.7 Flash (Reasoning Model)",
    providers: ["openrouter"],
    reasoningEfforts: ["minimal", "low", "medium", "high"],
  },
  {
    chef: "DeepSeek",
    chefSlug: "deepseek",
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1 (Reasoning Model)",
    providers: ["openrouter"],
    reasoningEfforts: ["low", "medium", "high"],
  },
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "openai/o3-mini",
    name: "OpenAI o3-mini (Reasoning Model)",
    providers: ["openrouter"],
    reasoningEfforts: ["low", "medium", "high"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash (Ultra Cheap - $0.075/1M)",
    providers: ["openrouter"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite ($0.075/1M)",
    providers: ["openrouter"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-3.5-flash",
    name: "Gemini 3.5 Flash ($0.15/1M)",
    providers: ["openrouter"],
  },
  {
    chef: "DeepSeek",
    chefSlug: "deepseek",
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3 / Chat ($0.14/1M)",
    providers: ["openrouter"],
  },
  {
    chef: "Meta",
    chefSlug: "meta",
    id: "meta-llama/llama-3.3-70b-instruct:floor",
    name: "Llama 3.3 70B (:floor lowest price)",
    providers: ["openrouter"],
  },
  {
    chef: "Z-AI",
    chefSlug: "z-ai",
    id: "z-ai/glm-5.2",
    name: "GLM 5.2",
    providers: ["openrouter"],
  },
  {
    chef: "Mistral",
    chefSlug: "mistralai",
    id: "mistralai/ministral-3b-2512",
    name: "Ministral 3B",
    providers: ["openrouter"],
  },
];
