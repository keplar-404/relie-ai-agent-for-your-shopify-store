import { createDeepAgent, FilesystemBackend } from "deepagents";
import { ChatOpenRouter } from "@langchain/openrouter";
import { env } from "@/lib/env";
import * as tools from "./tools";
import { SYSTEM_PROMPT } from "./prompt";
import { todoListMiddleware } from "langchain";

export interface BuildAgentOptions {
  model?: string;
  reasoning?: string;
}

export function buildRelieAgent({ model, reasoning }: BuildAgentOptions = {}) {
  const chatModel = new ChatOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    model: model || "openrouter/auto",
    temperature: 0.7,
    maxTokens: 30000, // 30,000 output tokens (~100,000-120,000 characters per turn) - maximized to fit within your key affordability limit (31,755 tokens)
    modelKwargs: reasoning ? { reasoning: { effort: reasoning } } : {},
  });

  const backend = new FilesystemBackend({
    rootDir: process.cwd(),
    virtualMode: true,
  });

  return createDeepAgent({
    name: "relie-agent",
    model: chatModel,
    backend,
    skills: ["/skills/deep-agent-skills/"],
    permissions: [
      {
        operations: ["write"],
        paths: ["/skills/**"],
        mode: "deny",
      },
    ],
    middleware: [todoListMiddleware()],
    tools: Object.values(tools),
    systemPrompt: SYSTEM_PROMPT,
  });
}
