import { createDeepAgent } from "deepagents";
import { ChatOpenRouter } from "@langchain/openrouter";
import { env } from "@/lib/env";
import * as tools from "./tools";
import { SYSTEM_PROMPT } from "./prompt";

export interface BuildAgentOptions {
  model?: string;
  reasoning?: string;
}

export function buildRelieAgent({ model, reasoning }: BuildAgentOptions = {}) {
  const chatModel = new ChatOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    model: model || "openrouter/free",
    temperature: 0.7,
    modelKwargs: reasoning ? { reasoning: { effort: reasoning } } : {},
  });

  return createDeepAgent({
    name: "relie-agent",
    model: chatModel,
    tools: Object.values(tools),
    systemPrompt: SYSTEM_PROMPT,
  });
}
