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
    id: "openrouter/free",
    name: "OpenRouter Auto/Free",
    providers: ["openrouter"],
  },
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "openai/gpt-4o",
    name: "GPT-4o",
    providers: ["openrouter"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    providers: ["openrouter"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    providers: ["openrouter"],
    reasoningEfforts: ["minimal", "low", "medium", "high"],
  },
  {
    chef: "DeepSeek",
    chefSlug: "deepseek",
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    providers: ["openrouter"],
    reasoningEfforts: ["low", "high", "max"],
  },
  {
    chef: "Meta",
    chefSlug: "llama",
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    providers: ["openrouter"],
  },
];


