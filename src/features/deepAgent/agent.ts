import { createDeepAgent, FilesystemBackend } from "deepagents";
import { ChatOpenRouter } from "@langchain/openrouter";
import { env } from "@/lib/env";
import * as tools from "./tools";
import { SYSTEM_PROMPT } from "./prompt";
import { todoListMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool } from "pg";

export interface BuildAgentOptions {
  model?: string;
  reasoning?: string;
}

let poolInstance: Pool | undefined;
let checkpointerInstance: PostgresSaver | MemorySaver | undefined;

function getCheckpointer() {
  if (checkpointerInstance) return checkpointerInstance;

  const dbUrl = env.SUPABASE_DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  if (dbUrl) {
    try {
      poolInstance = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        max: 10,
      });
      checkpointerInstance = new PostgresSaver(poolInstance);
      console.log("✅ Using Supabase PostgresSaver for LangGraph checkpoints.");
      return checkpointerInstance;
    } catch (err) {
      console.warn("⚠️ Failed to initialize Supabase PostgresSaver, falling back to MemorySaver:", err);
    }
  }

  checkpointerInstance = new MemorySaver();
  return checkpointerInstance;
}

export function buildRelieAgent({ model, reasoning }: BuildAgentOptions = {}) {
  const chatModel = new ChatOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    model: model || "openrouter/auto",
    temperature: 0.7,
    maxTokens: 30000,
    modelKwargs: reasoning ? { reasoning: { effort: reasoning } } : {},
  });

  const backend = new FilesystemBackend({
    rootDir: process.cwd(),
    virtualMode: true,
  });

  const checkpointer = getCheckpointer();

  return createDeepAgent({
    name: "relie-agent",
    model: chatModel,
    backend,
    checkpointer,
    skills: ["/skills/deep-agent-skills/"],
    permissions: [
      {
        operations: ["write"],
        paths: ["/**"],
        mode: "deny",
      },
    ],
    middleware: [todoListMiddleware()],
    tools: Object.values(tools),
    systemPrompt: SYSTEM_PROMPT,
  });
}
