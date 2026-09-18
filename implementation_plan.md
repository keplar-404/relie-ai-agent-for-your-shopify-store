# Production-Grade Deep Agent Implementation Plan

> **Scope**: Transform the prototype Relie Deep Agent into a resilient, scalable, production-grade AI agent platform based on official LangChain / LangGraph Deep Agent guidelines and the v3 Attachment Processing Pipeline.

---

## 1. Executive Summary & Goals

The prototype Relie Deep Agent currently uses `FilesystemBackend` mounted to the host server directory (`process.cwd()`), lacks production resilience middleware, relies on in-memory or uninitialized checkpointers, and passes sandbox state via global module singletons.

This implementation plan transitions Relie AI into a **production-ready architecture**:

1. **Strict File System Isolation**:
   - Eliminate direct host filesystem access (`FilesystemBackend`).
   - Introduce `CompositeBackend` combining an ephemeral, thread-scoped `StateBackend` for scratchpads/tool offloading with a persistent `StoreBackend` under `/memories/` for long-term merchant preferences.
2. **Robust Checkpointing & Durability**:
   - Configure `@langchain/langgraph-checkpoint-postgres` (`PostgresSaver`) with automated table initialization (`checkpointer.setup()`) using `SUPABASE_DATABASE_URL`, falling back gracefully to `MemorySaver` in local development.
   - Enforce thread continuity via stable `thread_id` so merchants can seamlessly pause, resume, and undo actions across sessions.
3. **Fault Tolerance & Cost Guardrails**:
   - Add `modelRetryMiddleware` for automatic exponential backoff on OpenRouter rate limits (429) and transient 5xx errors.
   - Add `toolRetryMiddleware` for external I/O tools (`extract_assets`, `calculator`).
   - Add `modelCallLimitMiddleware` (e.g. 50 turns) and `toolCallLimitMiddleware` (e.g. 150 tool calls) to prevent runaway loops and runaway token costs.
4. **Security & Permissions**:
   - Enforce declarative deny permissions on `/skills/**` and `/policies/**` to prevent prompt injections or rogue subagents from modifying system instructions.
5. **Runtime Context Schema**:
   - Define a Zod `contextSchema` (`userId`, `projectId`, `sandboxId`, `threadId`) passed at invocation time, eliminating race conditions across concurrent multi-tenant requests.
6. **V3 Attachment Pipeline Integration**:
   - Full alignment with `PDF_SUBAGENT_ARCHITECTURE.md` (v3): consuming pre-processed Supabase Storage CDN URLs (`user_pdf_N` page PNGs, `user_image_N`, `user_text_N`) directly without redundant file fetching.

---

## 2. Architectural Design

```
                                 ┌──────────────────────────────────────────────┐
                                 │                 Client (UI)                  │
                                 │   useChat() + attachments + threadId         │
                                 └──────────────────────┬───────────────────────┘
                                                        │
                                                        │ POST /api/agent
                                                        ▼
                                 ┌──────────────────────────────────────────────┐
                                 │         Next.js Route (/api/agent)           │
                                 │   - Auth verification (Supabase)             │
                                 │   - Context: { userId, projectId, sandboxId }│
                                 └──────────────────────┬───────────────────────┘
                                                        │
                                                        │ buildRelieAgent()
                                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       Relie Deep Agent Runtime                                         │
│                                                                                                        │
│   ┌────────────────────────────────┐  ┌────────────────────────────────────────────────────────────┐   │
│   │           Checkpointer         │  │                    CompositeBackend                        │   │
│   │   PostgresSaver (Supabase DB)  │  │   ┌────────────────────────┐  ┌────────────────────────┐   │   │
│   │   - Table auto-setup           │  │   │  Default: StateBackend │  │ /memories/:StoreBackend│   │   │
│   │   - Scoped by thread_id        │  │   │  (thread-scoped,       │  │ (persistent cross-     │   │   │
│   │   - Fallback to MemorySaver    │  │   │   ephemeral scratch)   │  │  thread brand memory)  │   │   │
│   └────────────────────────────────┘  │   └────────────────────────┘  └────────────────────────┘   │   │
│                                       └────────────────────────────────────────────────────────────┘   │
│                                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                   Middleware Stack                                             │   │
│   │   1. todoListMiddleware()             -> Structured planning & step tracking                   │   │
│   │   2. modelRetryMiddleware()           -> Backoff retries on 429/5xx (max 3 retries)            │   │
│   │   3. toolRetryMiddleware()            -> Retries on I/O tools (extract_assets)                 │   │
│   │   4. modelCallLimitMiddleware(50)     -> Caps runaway model turns per session                  │   │
│   │   5. toolCallLimitMiddleware(150)     -> Caps runaway tool invocations per session             │   │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                Declarative Permissions                                         │   │
│   │   deny:  /skills/**, /policies/** (Read-only capabilities; write operations blocked)           │   │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                      Agent Tools                                               │   │
│   │   - Daytona Sandbox FS Tools (list_fs, read_file_text, upload_files, replace_in_files, ...)    │   │
│   │   - Validation Tools (run_typecheck, get_console_logs)                                         │   │
│   │   - Visual Tools (extract_assets via Gemini Vision + Sharp + Supabase CDN)                     │   │
│   │   - Safe Math (calculator)                                                                     │   │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Plan

### 3.1 Deep Agent Factory (`src/features/deepAgent/agent.ts`)

#### Changes Required:
1. **Define Runtime Context Schema**:
   ```ts
   export const AgentContextSchema = z.object({
     userId: z.string().optional(),
     projectId: z.string().optional(),
     sandboxId: z.string().optional(),
   });
   export type AgentContext = z.infer<typeof AgentContextSchema>;
   ```
2. **Replace Backend**:
   - Remove `new FilesystemBackend({ rootDir: process.cwd(), virtualMode: true })`.
   - Implement `CompositeBackend`:
     ```ts
     const backend = new CompositeBackend(
       new StateBackend(),
       {
         "/memories/": new StoreBackend({
           namespace: (rt) => [
             "user-memories",
             (rt?.context as AgentContext | undefined)?.userId || "global",
           ],
         }),
       },
     );
     ```
3. **Postgres Checkpointer Auto-Provisioning**:
   - Create a singleton checkpointer initialization function:
     ```ts
     export async function getCheckpointer(): Promise<PostgresSaver | MemorySaver>
     ```
   - When `SUPABASE_DATABASE_URL` is available, instantiate `PostgresSaver(pool)` and await `saver.setup()` once to guarantee the required schema (`checkpoints`, `checkpoint_blobs`, `checkpoint_writes`) is created.
   - Fall back safely to `MemorySaver()` if the database is unreachable.
4. **Resilience Middleware Stack**:
   - `todoListMiddleware()`
   - `modelRetryMiddleware({ maxRetries: 3, backoffFactor: 2.0, initialDelayMs: 1000 })`
   - `toolRetryMiddleware({ maxRetries: 2, tools: ["extract_assets", "calculator"] })`
   - `modelCallLimitMiddleware({ runLimit: 50 })`
   - `toolCallLimitMiddleware({ runLimit: 150 })`
5. **Security Permissions**:
   - Add declarative permissions to `createDeepAgent`:
     ```ts
     permissions: [
       {
         operations: ["write"],
         paths: ["/skills/**", "/policies/**"],
         mode: "deny",
       },
     ]
     ```

---

### 3.2 System Prompt & Memory Protocol (`src/features/deepAgent/prompt.ts`)

#### Changes Required:
1. **Section 19: Persistent Memory**:
   - Inform the agent about its persistent memory at `/memories/`.
   - On initial turns, inspect `/memories/brand.md` or `/memories/preferences.md` for known merchant branding rules (primary colors, typography, layout rules).
   - Update `/memories/brand.md` when the user states durable project preferences.
2. **Section 18: Attachment Protocol (v3)**:
   - Reinforce that all attachments in the `--- ATTACHMENTS ---` section are pre-processed and hosted on Supabase Storage.
   - For PDFs, use the provided page PNG URLs (`pageNumber`, `url`) directly or pass them to `extract_assets` for cropping visual components. Never try to download or parse raw PDF buffers.
   - Use public CDN URLs directly in generated React components (`<img src="..."/>`).

---

### 3.3 Server Route & Streaming (`src/app/api/agent/route.ts` & `src/features/deepAgent/stream.ts`)

#### Changes Required:
1. **`src/app/api/agent/route.ts`**:
   - Retrieve authenticated user ID using Supabase server client:
     ```ts
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
     const userId = user?.id || "anonymous";
     ```
   - Build agent: `const agent = await buildRelieAgent({ model, reasoning });`
   - Build runtime context: `{ userId, projectId: chatId || undefined, sandboxId: sandboxId || undefined }`.
   - Pass context and `activeThreadId` into `runAgentStream`.
2. **`src/features/deepAgent/stream.ts`**:
   - Accept `context?: AgentContext` in `runAgentStream`.
   - Pass `context` into `agent.streamEvents(input, { ..., context, configurable: { thread_id: activeThreadId } })`.
   - Pass `userId` into LangSmith run metadata for unified observability.

---

### 3.4 Sandbox Tool Context Binding (`src/features/deepAgent/tools/`)

#### Changes Required:
1. In `getConsoleLogsTool.ts` and `runTypecheckTool.ts`:
   - Inspect tool input `sandboxId`, then `(config as any)?.context?.sandboxId`, falling back to `getActiveSandboxId()`.
2. In FS tools (`fsTools/`):
   - Maintain seamless backward compatibility while enabling multi-tenant resolution where appropriate.

---

## 4. File-by-File Change Matrix

| File Path | Action | Key Updates |
|---|---|---|
| [src/features/deepAgent/agent.ts](file:///home/keplar/code/relie-ai-agent-for-your-shopify-store/src/features/deepAgent/agent.ts) | MODIFY | `CompositeBackend` (StateBackend + StoreBackend), async `PostgresSaver.setup()`, retry & limit middleware, `permissions`, `contextSchema`. |
| [src/features/deepAgent/prompt.ts](file:///home/keplar/code/relie-ai-agent-for-your-shopify-store/src/features/deepAgent/prompt.ts) | MODIFY | Add section 19 for `/memories/` brand persistence; ensure v3 attachment instructions are clear. |
| [src/app/api/agent/route.ts](file:///home/keplar/code/relie-ai-agent-for-your-shopify-store/src/app/api/agent/route.ts) | MODIFY | Await `buildRelieAgent()`, extract authenticated `userId`, construct and pass `AgentContext`. |
| [src/features/deepAgent/stream.ts](file:///home/keplar/code/relie-ai-agent-for-your-shopify-store/src/features/deepAgent/stream.ts) | MODIFY | Accept `context` argument, pass to `agent.streamEvents({ context, configurable: { thread_id } })`. |

---

## 5. Verification & Testing Plan

### Automated Checks:
```bash
# 1. TypeScript compilation check
bunx tsc --noEmit

# 2. Production Next.js build validation
bun run build
```

### Functional Validation Scenarios:
1. **Checkpointer Verification**:
   - Verify Postgres checkpointer auto-provisions tables in Supabase Postgres on first startup.
   - Verify multi-turn conversations persist across page reloads using the same `threadId`.
2. **Fault Tolerance Verification**:
   - Simulate a tool error or timeout in `extract_assets` to verify `toolRetryMiddleware` retries automatically.
   - Verify `modelCallLimitMiddleware` halts runaway loops after 50 turns.
3. **Memory Isolation & Persistence**:
   - Ask the agent to save a brand color in `/memories/brand.md`.
   - In a subsequent turn, verify the agent reads `/memories/brand.md` correctly.
   - Verify the host server directory has no leftover temporary files (guaranteed by `StateBackend`).
4. **V3 Attachment Pipeline Cohesion**:
   - Upload an attachment via `/api/attachments/upload`.
   - Submit a prompt referencing the attachment; verify the agent uses the generated CDN URLs in its code without trying to re-split or re-fetch.
