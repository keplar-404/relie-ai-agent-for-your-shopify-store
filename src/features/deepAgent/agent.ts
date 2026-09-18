import {
  createDeepAgent,
  CompositeBackend,
  StateBackend,
  StoreBackend,
} from "deepagents";
import type { StoreBackendContext } from "deepagents";
import { ChatOpenRouter } from "@langchain/openrouter";
import { env } from "@/lib/env";
import * as tools from "./tools";
import { SYSTEM_PROMPT } from "./prompt";
import {
  todoListMiddleware,
  modelRetryMiddleware,
  toolRetryMiddleware,
  modelCallLimitMiddleware,
  toolCallLimitMiddleware,
} from "langchain";
import { MemorySaver, InMemoryStore } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool } from "pg";
import { z } from "zod";

// ── Runtime Context Schema ────────────────────────────────────────────────────
export const AgentContextSchema = z.object({
  userId: z.string().optional(),
  projectId: z.string().optional(),
  sandboxId: z.string().optional(),
});
export type AgentContext = z.infer<typeof AgentContextSchema>;

// ── Singletons ────────────────────────────────────────────────────────────────
let _pool: Pool | undefined;
let _checkpointer: PostgresSaver | MemorySaver | undefined;
let _store: InMemoryStore | undefined;
let _checkpointerReady = false;

export interface BuildAgentOptions {
  model?: string;
  reasoning?: string;
}

/**
 * Returns a singleton PostgresSaver (Supabase) with tables auto-provisioned,
 * or falls back to MemorySaver when the DB URL is absent / unreachable.
 */
export async function getCheckpointer(): Promise<PostgresSaver | MemorySaver> {
  if (_checkpointer && _checkpointerReady) return _checkpointer;

  const dbUrl = env.SUPABASE_DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL;
  if (dbUrl) {
    try {
      if (!_pool) {
        _pool = new Pool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          max: 10,
        });
      }
      const saver = new PostgresSaver(_pool);
      // Auto-provision checkpoint tables on first use (idempotent)
      await saver.setup();
      _checkpointer = saver;
      _checkpointerReady = true;
      console.log("✅ PostgresSaver ready (Supabase) — checkpoint tables provisioned.");
      return _checkpointer;
    } catch (err) {
      console.warn("⚠️  PostgresSaver init failed, falling back to MemorySaver:", err);
      // Reset so the next request retries rather than permanently using MemorySaver
      _checkpointer = undefined;
      _checkpointerReady = false;
    }
  }

  _checkpointer = new MemorySaver();
  _checkpointerReady = true;
  // ponytail: InMemoryStore — swap for PostgresStore if you need store persistence across server restarts
  return _checkpointer;
}

/**
 * Returns a singleton InMemoryStore for /memories/ StoreBackend routing.
 * ponytail: InMemoryStore — persist across restarts by swapping for PostgresStore
 */
function getStore(): InMemoryStore {
  if (!_store) _store = new InMemoryStore();
  return _store;
}

/**
 * Builds a production-grade Relie Deep Agent instance.
 * Async because PostgresSaver.setup() must await table provisioning.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function buildRelieAgent(
  { model, reasoning }: BuildAgentOptions = {}
) {
  const chatModel = new ChatOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    model: model || "openrouter/auto",
    temperature: 0.7,
    maxTokens: 30000,
    modelKwargs: reasoning ? { reasoning: { effort: reasoning } } : {},
  });

  const checkpointer = await getCheckpointer();
  const store = getStore();

  return createDeepAgent({
    name: "relie-agent",
    model: chatModel,
    // CompositeBackend: ephemeral scratch for everything; StoreBackend handles /memories/ (cross-thread)
    backend: new CompositeBackend(
      new StateBackend(),
      {
        "/memories/": new StoreBackend({
          namespace: (ctx: StoreBackendContext) => [
            "user-memories",
            // userId is passed via context configurable by the API route
            (ctx.config?.configurable?.["userId"] as string | undefined) ?? "global",
          ],
        }),
      }
    ),
    checkpointer,
    store,
    contextSchema: AgentContextSchema,
    skills: ["/skills/deep-agent-skills/"],
    permissions: [
      {
        operations: ["write"],
        paths: ["/skills/**", "/policies/**"],
        mode: "deny",
      },
    ],
    middleware: [
      todoListMiddleware(),
      modelRetryMiddleware({ maxRetries: 3, backoffFactor: 2.0, initialDelayMs: 1000 }),
      toolRetryMiddleware({ maxRetries: 2, tools: ["extract_assets", "calculator"] }),
      modelCallLimitMiddleware({ runLimit: 50 }),
      toolCallLimitMiddleware({ runLimit: 150 }),
    ],
    tools: Object.values(tools),
    systemPrompt: SYSTEM_PROMPT,
  });
}
