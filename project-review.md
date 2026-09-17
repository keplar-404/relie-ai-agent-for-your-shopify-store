# Relie AI Agent for Your Shopify Store — Project Review

> **Purpose of this document:** This is a deep, end-to-end architectural review of the entire `relie-ai-agent-for-your-shopify-store` codebase. It is written so that another AI coding agent (or a new human engineer) can read this single file and gain a complete mental model of the project: what it is, how it works, what every file and folder does, how data flows, what the runtime architecture looks like, and what conventions to follow when extending it.
>
> **Read this first before touching any code.**

---

## 1. Project at a Glance

**Name:** `relie-ai-agent-for-your-shopify-store`
**Type:** Next.js 16 (App Router) full-stack web application
**Purpose:** A multi-tenant AI coding agent that lets Shopify merchants chat with an AI ("Relie AI") to generate, edit, and preview React/TypeScript storefront UI inside an isolated cloud sandbox (Daytona). The agent can read/write files, run shell commands, typecheck, and extract visual assets from images — all streamed live to a chat UI with a side-by-side live preview of the running sandbox.
**Package manager:** Bun (`bun@1.3.14`)
**Language:** TypeScript (strict mode, target ES2017)
**UI framework:** React 19.2.8 + Tailwind CSS v4 + Radix UI + shadcn/ui
**AI stack:** LangChain 1.x + LangGraph + `deepagents` (Deep Agents) + Vercel AI SDK 7 + OpenRouter (multi-model gateway)
**Sandbox:** Daytona SDK (`@daytona/sdk`) — ephemeral cloud Linux containers running a React + Vite + Bun template
**Auth & DB:** Supabase (Google OAuth + Postgres for projects)
**Storage:** Supabase Storage (for extracted visual assets)
**Observability:** LangSmith tracing
**State:** Zustand (client) + LangGraph checkpointer (server, Postgres-backed when available)

The product is essentially a **ChatGPT-style coding agent** (think Cursor / v0 / Bolt.new) but specialized for Shopify storefront UI generation, with a hard sandbox boundary and a live preview pane.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              Browser (Client)                            │
│                                                                          │
│  ┌────────────────────┐    ┌────────────────────┐    ┌────────────────┐  │
│  │  Home (/)          │    │  /chat/[id]        │    │  /projects     │  │
│  │  ChatInputWidget   │    │  Resizable split:  │    │  Project list  │  │
│  │  → /chat/<uuid>    │    │  - ChatContent     │    │  CRUD UI       │  │
│  └────────────────────┘    │  - ChatPreviewPanel│    └────────────────┘  │
│                            │    (WebPreview)    │                        │
│                            └────────────────────┘                        │
│                                       │                                  │
│                                       │ useChat() + DefaultChatTransport │
│                                       ▼                                  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Zustand store: sandboxId, selectedModel, selectedReasoning,       │  │
│  │  pendingMessage                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ HTTP (streaming)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       Next.js Server (App Router)                        │
│                                                                          │
│  /api/agent          → buildRelieAgent() + runAgentStream()              │
│  /api/chat           → simple ChatOpenRouter passthrough (legacy)        │
│  /api/sandbox        → createCodeSandBox() (Daytona provision)           │
│  /api/sandbox/fs/*   → 17 thin wrappers around fsOperations              │
│  /api/projects       → Supabase CRUD on `projects` table                 │
│  /api/health         → uptime/status probe                              │
│  /auth/callback      → Supabase OAuth code exchange                      │
│                                                                          │
│  Middleware (src/middleware.ts) → Supabase session refresh + auth gate   │
└──────────────────────────────────────────────────────────────────────────┘
       │                              │                          │
       │                              │                          │
       ▼                              ▼                          ▼
┌─────────────────┐         ┌────────────────────┐      ┌──────────────────┐
│  OpenRouter     │         │  Daytona Sandbox   │      │  Supabase        │
│  (LLM gateway)  │         │  /home/daytona/app │      │  - Auth (Google) │
│  - GPT, Claude  │         │  React + Vite + Bun│      │  - Postgres      │
│  - Gemini, etc. │         │  HMR on :3000      │      │  - Storage       │
└─────────────────┘         └────────────────────┘      └──────────────────┘
                                       │
                                       │ (preview URL signed)
                                       ▼
                            ┌────────────────────┐
                            │  WebPreview iframe │
                            │  (right pane)      │
                            └────────────────────┘
```

**Key flow:**
1. User lands on `/`, types a prompt, picks a model.
2. Client generates a UUID, navigates to `/chat/<uuid>`.
3. Chat page mounts → `POST /api/sandbox` → Daytona creates an ephemeral container from snapshot `react-vite-bun-v2` (or builds it on first run from `oven/bun:1-debian` + a template repo).
4. Sandbox returns `{ sandboxId, previewUrl }`; client stores `sandboxId` in Zustand and renders the preview iframe.
5. The pending prompt is auto-submitted via `useChat` → `POST /api/agent` with `{ messages, model, reasoning, sandboxId, chatId, threadId }`.
6. Server builds a `DeepAgent` (LangChain + LangGraph + OpenRouter), streams events back as Vercel AI SDK `UIMessageChunk`s.
7. The agent invokes tools (`list_fs`, `read_file_text`, `upload_file`, `replace_in_files`, `run_typecheck`, `get_console_logs`, `extract_assets`, `calculator`) — each tool calls a thin API route that hits the Daytona sandbox.
8. The agent writes React/TS code into `/home/daytona/app`; Vite HMR updates the preview iframe in real time.

---

## 3. Tech Stack & Key Dependencies

From `package.json`:

| Category | Package | Purpose |
|---|---|---|
| Framework | `next@16.3.0` | App Router, RSC, typed routes, React Compiler enabled |
| UI runtime | `react@19.2.8`, `react-dom@19.2.8` | Client UI |
| Styling | `tailwindcss@4`, `@tailwindcss/postcss`, `tw-animate-css`, `tailwind-merge`, `clsx`, `cn` | Utility-first CSS + design tokens |
| Components | `radix-ui@1.6.7`, `shadcn@4.16.2`, `lucide-react@1.31.0` | Headless primitives + icons |
| AI SDK | `ai@7.0.66`, `@ai-sdk/react@4.0.87`, `@ai-sdk/langchain@3.0.84` | Vercel AI SDK + LangChain bridge |
| LangChain | `langchain@1.5.10`, `@langchain/core@1.2.9`, `@langchain/openrouter@0.4.6` | LLM orchestration |
| Deep Agents | `deepagents@1.13.2` | `createDeepAgent`, `FilesystemBackend`, todo middleware |
| LangGraph | `@langchain/langgraph-checkpoint-postgres@1.0.5` | Postgres-backed checkpointer |
| Sandbox | `@daytona/sdk@0.204.1`, `@langchain/daytona@0.2.2` | Cloud sandbox provisioning + FS/process/PTY |
| Auth/DB | `@supabase/supabase-js@2.116.0`, `@supabase/ssr@0.12.6` | Google OAuth + Postgres + Storage |
| State | `zustand@5.0.15` | Client global store |
| Validation | `zod@4.4.3` | Env + tool input schemas |
| Streaming UI | `streamdown@2.5.0`, `@streamdown/code`, `@streamdown/math`, `@streamdown/mermaid`, `@streamdown/cjk` | Markdown rendering for AI messages |
| Resize | `react-resizable-panels@4.12.2` | Split-pane chat/preview layout |
| Toasts | `sonner@2.0.8` | Error notifications (rate limit, credit, token) |
| Image | `sharp@0.35.4` | Image decode/crop for asset extraction |
| DB driver | `pg@8.23.0`, `@types/pg` | Postgres pool for checkpointer |
| Dev | `typescript@5`, `eslint@9`, `eslint-config-next@16.3.0`, `babel-plugin-react-compiler@1.0.0`, `agentation@3.0.2` | TS, lint, React Compiler, dev-only annotation overlay |

**Notable config:**
- `next.config.ts`: `reactCompiler: true`, `typedRoutes: true`, `serverExternalPackages: ["@daytona/sdk"]` (Daytona SDK is kept out of the bundler).
- `tsconfig.json`: strict, `paths: { "@/*": ["./src/*"] }`.
- `components.json`: shadcn config — style `radix-vega`, base color `neutral`, registries include `@ai-elements`.
- `eslint.config.mjs`: extends `eslint-config-next/core-web-vitals` + `typescript`.
- `postcss.config.mjs`: just `@tailwindcss/postcss`.
- `skills-lock.json`: pins 27 third-party skills (LangChain, LangGraph, Daytona, Supabase, shadcn, etc.) by SHA-256 hash for reproducible agent context.

---

## 4. Root-Level Files (What Each One Does)

| File | Purpose |
|---|---|
| `package.json` | Project manifest, scripts (`dev`, `build`, `start`, `lint`), all deps, packageManager = bun. |
| `bun.lock` | Bun lockfile (do not edit by hand). |
| `tsconfig.json` | TS strict mode, `@/*` → `src/*` path alias, Next.js plugin. |
| `next.config.ts` | Enables React Compiler, typed routes, marks `@daytona/sdk` as external. |
| `eslint.config.mjs` | Flat ESLint config using `eslint-config-next` presets. |
| `postcss.config.mjs` | Tailwind v4 PostCSS plugin. |
| `components.json` | shadcn/ui project metadata (style, registries, aliases). |
| `README.md` | Default Next.js starter README (boilerplate, not project-specific). |
| `PDF_SUBAGENT_ARCHITECTURE.md` | **Important design doc** — describes a two-tier PDF → Markdown → Code pipeline (Tier 1: vision sub-agent extracts UI sections from PDFs and uploads to Supabase; Tier 2: main coding agent consumes the Markdown + CDN URLs). The actual implementation is partially in `assetExtraction/` (image-based, not PDF-based). |
| `PRODUCTION_ROADMAP.md` | **Important roadmap** — 7 phases of production hardening: Postgres checkpointer, StoreBackend memory, cloud sandboxing, LangSmith tracing, context trimming, HITL, CI/CD. Most items are unchecked (planned work). |
| `Sandbox_FS_Postman_Collection.json` | Postman collection documenting all 17 `/api/sandbox/fs/*` endpoints with sample payloads. Useful for manual testing. |
| `skills-lock.json` | Hash-pinned registry of 27 third-party skills (LangChain ecosystem, shadcn, Supabase, Daytona, etc.) the agent can reference. |
| `.gitignore` | Standard Next.js + Bun ignores. |

---

## 5. Directory Tree (Annotated)

```
relie-ai-agent-for-your-shopify-store/
├── public/                          # Static assets served at /
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg
│   └── images/
│       ├── background.png           # Marketing/landing background
│       ├── dashboard.png            # Dashboard screenshot
│       ├── dropdown.svg             # UI icon
│       └── logo.svg                 # Brand logo
│
├── skills/                          # Agent skill packages (loaded by DeepAgent)
│   ├── _template/                   # Boilerplate for authoring new skills (NOT loaded)
│   │   ├── SKILL.md                 # Frontmatter + progressive disclosure template
│   │   ├── assets/{schema.json, template.md}
│   │   ├── references/{api-reference.md, style-guide.md}
│   │   └── scripts/execute_task.ts
│   └── deep-agent-skills/           # ACTIVE skills (scanned by createDeepAgent)
│       ├── README.md                # How to add new skills
│       ├── ponytail/SKILL.md        # "Be lazy" minimalist engineering skill
│       └── shopify-store-helper/SKILL.md  # Shopify ops/customer support skill
│
├── src/
│   ├── middleware.ts                # Supabase session refresh + auth gate
│   │
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout: fonts, ThemeProvider, Toaster, Agentation (dev)
│   │   ├── page.tsx                 # Landing page (/) — ChatInputWidget → /chat/<uuid>
│   │   ├── globals.css              # Tailwind v4 + shadcn tokens (light/dark OKLCH)
│   │   ├── favicon.ico
│   │   │
│   │   ├── (chat)/                  # Route group (no URL segment)
│   │   │   ├── layout.tsx           # Full-height flex container
│   │   │   └── chat/[...slug]/page.tsx  # /chat/<any> — split-pane chat + preview
│   │   │
│   │   ├── login/page.tsx           # Google OAuth sign-in card
│   │   ├── projects/page.tsx        # Project list/create/delete UI
│   │   ├── auth/callback/route.ts   # Supabase OAuth code exchange
│   │   │
│   │   └── api/                     # Server route handlers
│   │       ├── agent/route.ts       # POST → DeepAgent stream
│   │       ├── chat/route.ts        # POST → simple OpenRouter passthrough (legacy)
│   │       ├── health/route.ts      # GET/HEAD → uptime JSON
│   │       ├── projects/route.ts    # GET/POST/DELETE → Supabase projects table
│   │       ├── sandbox/route.ts     # POST → create Daytona sandbox
│   │       └── sandbox/fs/          # 17 thin FS API wrappers (see §10)
│   │
│   ├── components/
│   │   ├── ai-elements/             # Vercel AI SDK UI primitives (chat building blocks)
│   │   │   ├── attachments.tsx      # File attachment chips
│   │   │   ├── code-block.tsx       # Syntax-highlighted code (shiki)
│   │   │   ├── conversation.tsx     # Scrollable message list + auto-scroll button
│   │   │   ├── message.tsx          # Message bubble + MessageResponse (streamdown)
│   │   │   ├── model-selector.tsx   # Searchable model picker
│   │   │   ├── prompt-input.tsx     # Textarea + attachments + submit + provider
│   │   │   ├── reasoning.tsx        # Collapsible reasoning block
│   │   │   ├── shimmer.tsx          # Loading shimmer
│   │   │   ├── streamdown-plugins.ts # Streamdown plugin config
│   │   │   ├── tool.tsx             # Tool call/result card
│   │   │   └── web-preview.tsx      # iframe-based live preview
│   │   │
│   │   ├── ui/                      # shadcn/ui primitives (Radix-wrapped)
│   │   │   ├── alert-dialog.tsx, badge.tsx, button.tsx, card.tsx,
│   │   │   ├── collapsible.tsx, command.tsx, dialog.tsx, dropdown-menu.tsx,
│   │   │   ├── hover-card.tsx, input.tsx, input-group.tsx, resizable.tsx,
│   │   │   ├── select.tsx, spinner.tsx, tabs.tsx, textarea.tsx, tooltip.tsx
│   │   │
│   │   └── widgets/                 # Composite, domain-specific widgets
│   │       ├── README.md            # Convention: place complex multi-primitive widgets here
│   │       └── chat-input/          # The chat input bar used on / and /chat
│   │           ├── chat-input-widget.tsx  # Main widget (textarea + attach + model picker + submit)
│   │           ├── model-selector.tsx     # Model picker with reasoning effort pills
│   │           ├── models.ts              # DEFAULT_MODELS list (OpenRouter, Gemini, DeepSeek, etc.)
│   │           ├── prompt-attachments-display.tsx  # Attachment chips above textarea
│   │           └── index.ts               # Barrel export
│   │
│   ├── context/                     # Reserved for React Context (currently empty, has Read.md)
│   │
│   ├── features/                    # Feature-based modules (vertical slices)
│   │   ├── deepAgent/               # The AI agent itself
│   │   │   ├── agent.ts             # buildRelieAgent() — DeepAgent factory
│   │   │   ├── prompt.ts            # SYSTEM_PROMPT + PERSONA_PRIMER (Relie persona)
│   │   │   ├── stream.ts            # runAgentStream() — DeepAgent → UIMessageStream bridge
│   │   │   ├── index.ts             # Barrel
│   │   │   ├── README.md            # Stream contract docs
│   │   │   └── tools/
│   │   │       ├── index.ts         # Re-exports all tool groups
│   │   │       ├── calculator.ts    # Safe math eval (allow-listed)
│   │   │       ├── getConsoleLogsTool.ts  # Reads sandbox entrypoint stdout/stderr
│   │   │       ├── runTypecheckTool.ts   # Runs `npx tsc --noEmit` in sandbox
│   │   │       ├── fsTools/         # 15 sandbox FS tools (see §9)
│   │   │       └── assetExtraction/ # Vision-based UI asset cropper (see §11)
│   │   │
│   │   └── userChat/                # The chat UI feature
│   │       ├── index.ts             # Barrel
│   │       ├── components/
│   │       │   ├── chat-content.tsx       # Composes header + messages + input
│   │       │   ├── chat-header.tsx        # Logo + theme toggle + settings
│   │       │   ├── chat-message-list.tsx  # Renders messages (text/reasoning/tool parts)
│   │       │   └── chat-preview-panel.tsx # Tabs: Preview (iframe) | Code (placeholder)
│   │       └── hooks/
│   │           └── use-chat.ts      # useChatSession() — Vercel AI SDK + Zustand wiring
│   │
│   ├── hooks/                       # Reserved for custom hooks (currently empty, has Read.md)
│   │
│   ├── lib/
│   │   ├── env.ts                   # Zod-validated env vars (throws on missing)
│   │   ├── utils.ts                 # cn() — clsx + tailwind-merge
│   │   └── supabase/
│   │       ├── client.ts            # createBrowserClient (for client components)
│   │       ├── server.ts            # createServerClient (for RSC + route handlers)
│   │       ├── middleware.ts        # updateSession() — refresh + auth gate
│   │       └── index.ts             # Barrel
│   │
│   ├── services/
│   │   ├── Read.md                  # Convention note
│   │   └── codeSandbox/             # Daytona sandbox service layer
│   │       ├── index.ts             # Daytona client singleton + re-exports
│   │       ├── createSandbox.ts     # createCodeSandBox() — snapshot or build
│   │       ├── sandboxStore.ts      # In-memory active sandbox cache
│   │       ├── processOperations.ts # codeRun, executeCommand, sessions, codeInterpreter
│   │       ├── ptyOperations.ts     # Interactive PTY sessions
│   │       ├── fsOperations.ts      # Barrel → ./fsOperations/index.ts
│   │       └── fsOperations/        # 18 individual FS operation wrappers (see §9)
│   │
│   └── stores/
│       └── use-chat-store.ts        # Zustand: sandboxId, model, reasoning, pendingMessage
│
└── (config files at root: package.json, tsconfig.json, next.config.ts, etc.)
```

---

## 6. The `src/app/` Layer (Next.js App Router)

### 6.1 Root layout — `src/app/layout.tsx`
- Loads `Inter` and `Geist_Mono` Google fonts as CSS variables (`--font-sans`, `--font-geist-mono`).
- Wraps the app in `next-themes` `ThemeProvider` (default `system`, no transition flash).
- Mounts `sonner` `<Toaster richColors closeButton position="top-right" />` for error toasts.
- In dev only, mounts `<Agentation />` (the `agentation` package — a click-to-annotate overlay for AI agents).
- Sets `<html lang="en" suppressHydrationWarning>` and applies font + antialiased classes.

### 6.2 Landing page — `src/app/page.tsx`
- Client component. Reads `selectedModel`, `selectedReasoning` from Zustand.
- On submit: stores the `PromptInputMessage` in `pendingMessage`, generates `crypto.randomUUID()`, navigates to `/chat/<uuid>`.
- Renders a centered hero ("Relie AI Agent") + the `ChatInputWidget`.

### 6.3 Chat route group — `src/app/(chat)/`
- `(chat)` is a Next.js route group — it does **not** add a URL segment, just shares a layout.
- `layout.tsx`: full-screen flex container.
- `chat/[...slug]/page.tsx`: catch-all route (`/chat/anything`). On mount, fires `POST /api/sandbox` once (guarded by `useRef`), stores `sandboxId` in Zustand, then renders a `ResizablePanelGroup`:
  - **Left (40%, min 20%, max 60%):** `<ChatContent />` (header + messages + input).
  - **Right (hidden on mobile):** `<ChatPreviewPanel initialUrl={previewUrl} />` with tabs for Preview / Code.

### 6.4 Login — `src/app/login/page.tsx`
- Client component. Single "Sign in with Google" button using `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })`.
- Shows inline error and a spinner while loading.

### 6.5 Projects — `src/app/projects/page.tsx`
- Client component. Fetches `GET /api/projects` on mount, renders a grid of `Card`s.
- Each card shows name, description, created date, and two actions:
  - **Delete** (AlertDialog confirm → `DELETE /api/projects?id=...`)
  - **Open Chat** (Link to `/chat/<project.id>`)
- "New Project" button opens a Dialog with name + description fields → `POST /api/projects`.

### 6.6 Auth callback — `src/app/auth/callback/route.ts`
- Server route. Exchanges the OAuth `code` for a Supabase session, then redirects to `next` (default `/`) or `/auth/auth-code-error` on failure. Handles `x-forwarded-host` for production deployments.

### 6.7 Middleware — `src/middleware.ts`
- Runs `updateSession(request)` from `@/lib/supabase/middleware` on every request **except** `_next/static`, `_next/image`, `favicon.ico`, and image extensions.
- `updateSession` refreshes the Supabase auth cookie and redirects:
  - Unauthenticated users on protected paths → `/login`
  - Authenticated users on `/login` → `/`

---

## 7. The `src/app/api/` Layer (Server Route Handlers)

### 7.1 `POST /api/agent` — `src/app/api/agent/route.ts`
- **The main agent endpoint.** `maxDuration = 300` (5 min for Vercel).
- Body: `{ messages: UIMessage[], model: string, reasoning: string, sandboxId?: string, chatId?: string, threadId?: string }`.
- Calls `setActiveSandboxId(sandboxId)` so subsequent tool calls know which sandbox to target.
- Builds the agent via `buildRelieAgent({ model, reasoning })` and streams via `runAgentStream(agent, messages, req.signal, activeThreadId)`.
- Returns a Vercel AI SDK `UIMessageStreamResponse`.

### 7.2 `POST /api/chat` — `src/app/api/chat/route.ts`
- **Legacy/simple endpoint.** Direct `ChatOpenRouter` call without tools or DeepAgent.
- Injects a `SystemMessage` ("You are Relie…") plus a 2-message persona primer (Human "Who are you?" → AI "I'm Relie…") to handle free/wild-card OpenRouter models that ignore the system role.
- Streams back via `toUIMessageStream` → `createUIMessageStreamResponse`.
- Not currently wired to the UI (the UI uses `/api/agent`).

### 7.3 `GET/HEAD /api/health` — `src/app/api/health/route.ts`
- Returns `{ status: "ok", uptime, timestamp, environment }`. Used for uptime probes.

### 7.4 `GET/POST/DELETE /api/projects` — `src/app/api/projects/route.ts`
- All three methods require an authenticated Supabase user (401 otherwise).
- **GET:** `SELECT * FROM projects ORDER BY created_at DESC`.
- **POST:** validates `name` (non-empty string), inserts `{ user_id, name, description }`, returns the new row.
- **DELETE:** requires `?id=...`, deletes only if `user_id` matches the caller (RLS-friendly).

### 7.5 `POST /api/sandbox` — `src/app/api/sandbox/route.ts`
- Calls `createCodeSandBox()` (see §9.1), returns `{ previewUrl, sandboxId }`.
- Logs both values to the server console.

### 7.6 `POST /api/sandbox/fs/*` — 17 thin wrappers
All follow the same pattern: parse JSON body, call `setActiveSandboxId(sandboxId)` if provided, invoke the matching `fsOperations` function, return `{ success: true, ... }` or `{ error }` with HTTP 500. See §10 for the full list.

---

## 8. The `src/lib/` Layer

### 8.1 `src/lib/env.ts`
- Zod schema for required env vars:
  - `OPENROUTER_API_KEY` (min 4 chars)
  - `DAYTONA_API_KEY` (min 4 chars)
  - `LANGSMITH_TRACING` (default `"true"`)
  - `LANGSMITH_ENDPOINT`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`
  - `SUPABASE_DATABASE_URL` (optional — enables Postgres checkpointer)
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (optional)
  - `NODE_ENV` (enum, default `development`)
- On parse failure: logs flattened field errors and throws.
- Sets `process.env.LANGSMITH_*` from parsed values so LangChain picks them up.
- Exports a frozen `env` object.

### 8.2 `src/lib/utils.ts`
- Single export: `cn(...inputs)` = `twMerge(clsx(inputs))`. Standard shadcn helper.

### 8.3 `src/lib/supabase/`
- `client.ts` — `createBrowserClient` for client components (uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- `server.ts` — `createServerClient` for RSC + route handlers; reads/writes cookies via `next/headers`.
- `middleware.ts` — `updateSession(request)`: creates a server client bound to the request cookies, calls `supabase.auth.getUser()`, then enforces the auth gate (see §6.7).
- `index.ts` — barrel re-export.

---

## 9. The `src/services/codeSandbox/` Layer (Daytona Integration)

This is the **service layer** that wraps the Daytona SDK. It is the only place that talks to Daytona directly; everything else (tools, API routes) goes through here.

### 9.1 `createSandbox.ts` — `createCodeSandBox()`
- Tries to create a sandbox from snapshot `react-vite-bun-v2` with `ephemeral: true`, `autoStopInterval: 20` (minutes).
- If the snapshot doesn't exist (first run), builds it from `Image.base("oven/bun:1-debian")`:
  - `apt-get update && apt-get install -y curl git`
  - `git clone https://github.com/keplar-404/template-react-project.git /home/daytona/app`
  - `cd /home/daytona/app && bun install`
  - Entrypoint: `bun run --cwd /home/daytona/app dev -- --host 0.0.0.0 --port 3000`
- Caches the active sandbox instance via `setActiveSandbox(sandbox)`.
- Returns `{ previewUrl, sandboxId }` where `previewUrl` is a signed URL valid for 1 hour.

### 9.2 `sandboxStore.ts` — In-memory sandbox cache
- Module-level singletons: `activeSandboxInstance: Sandbox | null`, `activeSandboxId: string | null`.
- `setActiveSandbox(sandbox)` — caches both.
- `setActiveSandboxId(id)` — sets ID only; clears cached instance (forces re-fetch).
- `getActiveSandboxId()` — returns ID.
- `getActiveSandbox()` — returns cached instance, or fetches via `sandBox.get(id)`, or throws.

### 9.3 `index.ts` — Daytona client singleton
- `new Daytona({ apiKey: env.DAYTONA_API_KEY })` — throws if key missing.
- Re-exports `ptyOperations`, `processOperations`, `fsOperations`, `sandboxStore`, and `createCodeSandBox` as default.

### 9.4 `processOperations.ts` — Process / code execution
Thin wrappers around `sandbox.process.*` and `sandbox.codeInterpreter.*`:
- `codeRunStateless(sandboxId, code, params?, timeout?)`
- `runShellCommand(sandboxId, command, cwd?, env?, timeout?)`
- `createCodeInterpreterContext`, `listCodeInterpreterContexts`, `deleteCodeInterpreterContext`, `runCodeInContext`
- `createSession`, `listSessions`, `getSession`, `getSessionCommand`, `getEntrypointSession`
- `getEntrypointLogs`, `streamEntrypointLogs`
- `executeSessionCommand`, `getSessionCommandLogs`, `streamSessionCommandLogs`, `sendSessionCommandInput`, `deleteSession`

### 9.5 `ptyOperations.ts` — Interactive PTY
- `createPty`, `connectPty`, `listPtySessions`, `getPtySessionInfo`, `killPtySession`, `resizePtySession`
- `withPtySession<T>` — try/finally wrapper that auto-kills + disconnects.
- `runInteractivePtyCommand` — sends a command + timed inputs, waits for result.
- `runLongRunningPtyProcess` — runs for a fixed duration then kills.
- `handlePtyError` — throws on non-zero exit.

### 9.6 `fsOperations/` — 18 individual FS wrappers
All take a relative path (resolved against `/home/daytona/app` via `resolvePath.ts`) and call the matching `sandbox.fs.*` method. Most use `getActiveSandbox()` from `sandboxStore`.

| File | Daytona call | Purpose |
|---|---|---|
| `resolvePath.ts` | (pure) | Joins relative path to `/home/daytona/app`, normalizes. |
| `listFs.ts` | `fs.listFiles(path, { depth: 1 })` | List top-level entries. |
| `getFileDetails.ts` | `fs.getFileDetails(path)` | Name, size, modTime, modifiedAt. |
| `createFolder.ts` | `fs.createFolder(path, "775")` | Mkdir with default perms. |
| `setFilePermissions.ts` | `fs.setFilePermissions(path, perms)` | chmod/chown. |
| `uploadFile.ts` | `fs.uploadFile(buffer, path)` | Write one file. |
| `uploadFiles.ts` | `fs.uploadFiles(payload)` | Write many files in one call. |
| `uploadFileStream.ts` | `fs.uploadFileStream(source, path, options)` | Streamed upload (for large/binary). |
| `readFileText.ts` | `fs.downloadFile(path)` → slice lines | Read text (defaults lines 1–200). |
| `readFilesText.ts` | `fs.downloadFiles(requests)` | Read many files in one call. |
| `downloadFileStream.ts` | `fs.downloadFileStream(path, options)` | Streamed download. |
| `deleteFile.ts` | `fs.deleteFile(path, recursive)` | With safety guards (see below). |
| `searchFiles.ts` | `fs.searchFiles(path, pattern)` | Glob match. |
| `findFiles.ts` | `fs.findFiles(path, pattern)` | Grep inside files. |
| `replaceInFiles.ts` | `fs.replaceInFiles(files, pattern, newValue)` | Multi-file sed. |
| `moveFiles.ts` | `fs.moveFiles(source, dest)` | Rename/move. |
| `runTypecheck.ts` | `process.executeCommand("npx tsc --noEmit", cwd)` | TypeScript check. |
| `getConsoleLogs.ts` | `process.getEntrypointLogs()` | Sandbox stdout/stderr. |

**Safety guards in `deleteFile.ts`:**
- Refuses to delete `/home/daytona/app`, `/home/daytona/app/`, or `/`.
- Refuses to delete `package.json`, `package-lock.json`, `bun.lockb`.
- Auto-retries with `recursive: true` if Daytona complains about non-empty directories.
- Returns a friendly message if the file is already gone.

---

## 10. The `src/app/api/sandbox/fs/*` Layer (HTTP Wrappers)

17 thin POST (and one GET) endpoints that mirror the `fsOperations` functions. All follow the same pattern:

```ts
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { /* relevant fields */, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);
    const result = await /* fsOperations fn */(...);
    return NextResponse.json({ success: true, /* result */ });
  } catch (error) {
    console.error("[API: fs/<name>] Error:", error);
    return NextResponse.json({ error: ... }, { status: 500 });
  }
}
```

| Endpoint | Body | Calls |
|---|---|---|
| `POST /api/sandbox/fs/list` | `{ path?, sandboxId? }` | `listFs` |
| `POST /api/sandbox/fs/list-fs` | `{ path?, sandboxId? }` | `listFs` (alias) |
| `POST /api/sandbox/fs/get-file-details` | `{ path?, sandboxId? }` | `getFileDetails` |
| `POST /api/sandbox/fs/create-folder` | `{ path?, sandboxId? }` | `createFolder` |
| `POST /api/sandbox/fs/delete-file` | `{ path?, recursive?, sandboxId? }` | `deleteFile` |
| `POST /api/sandbox/fs/upload-file` | `{ content, path?, sandboxId? }` | `uploadFile` |
| `POST /api/sandbox/fs/upload-files` | `{ files: [{source, destination}], sandboxId? }` | `uploadFiles` |
| `POST /api/sandbox/fs/upload-file-stream` | multipart `file`+`path`+`sandboxId` OR JSON `{ content, path, encoding?, sandboxId? }` | `uploadFileStream` |
| `POST /api/sandbox/fs/read-file` | `{ path?, startLine?, endLine?, sandboxId? }` | `readFileText` |
| `POST /api/sandbox/fs/read-files` | `{ files: [{source, startLine?, endLine?}], sandboxId? }` | `readFilesText` |
| `GET /api/sandbox/fs/download-file-stream?path=...&sandboxId=...` | query params | `downloadFileStream` (returns `application/octet-stream` with `Content-Disposition: attachment`) |
| `POST /api/sandbox/fs/download-file-stream` | `{ path?, sandboxId? }` | `downloadFileStream` |
| `POST /api/sandbox/fs/download-file` | `{ path?, startLine?, endLine?, sandboxId? }` | `readFileText` (alias) |
| `POST /api/sandbox/fs/download-files` | `{ files: [...], sandboxId? }` | `readFilesText` (alias) |
| `POST /api/sandbox/fs/search-files` | `{ pattern?, path?, sandboxId? }` | `searchFiles` |
| `POST /api/sandbox/fs/find-files` | `{ pattern, path?, sandboxId? }` | `findFiles` |
| `POST /api/sandbox/fs/replace-in-files` | `{ files: string[], pattern, newValue, sandboxId? }` | `replaceInFiles` |
| `POST /api/sandbox/fs/move-files` | `{ source, destination, sandboxId? }` | `moveFiles` |
| `POST /api/sandbox/fs/set-file-permissions` | `{ path?, perms?, sandboxId? }` | `setFilePermissions` |

The `upload-file-stream` endpoint is the most flexible: it accepts either `multipart/form-data` (real file upload from a browser) or `application/json` (text or base64-encoded binary).

---

## 11. The `src/features/deepAgent/` Layer (The AI Agent)

This is the brain of the product. It builds a LangChain DeepAgent, gives it a curated toolset, and streams its output to the UI.

### 11.1 `agent.ts` — `buildRelieAgent({ model, reasoning })`
- Creates a `ChatOpenRouter` with `temperature: 0.7`, `maxTokens: 30000`, and `modelKwargs.reasoning.effort` if reasoning is set.
- Creates a `FilesystemBackend` rooted at `process.cwd()` with `virtualMode: true` (DeepAgent's built-in file tools).
- **Checkpointer selection** (`getCheckpointer()`):
  - If `SUPABASE_DATABASE_URL` is set → `PostgresSaver` with a `pg.Pool` (max 10, SSL relaxed).
  - Otherwise → `MemorySaver` (in-process, lost on restart).
  - Singleton-cached.
- Calls `createDeepAgent({ name: "relie-agent", model, backend, checkpointer, skills: ["/skills/deep-agent-skills/"], permissions: [{ operations: ["write"], paths: ["/**"], mode: "deny" }], middleware: [todoListMiddleware()], tools: Object.values(tools), systemPrompt: SYSTEM_PROMPT })`.
- **Permissions:** denies all writes to `/**` (the agent cannot write through DeepAgent's own FS backend — it must use the custom sandbox tools).
- **Skills:** loads everything under `/skills/deep-agent-skills/`.
- **Middleware:** `todoListMiddleware()` from `langchain` (built-in TODO planning).

### 11.2 `prompt.ts` — `SYSTEM_PROMPT` + `PERSONA_PRIMER`
A 17-section system prompt that defines Relie AI's identity, environment, stack, principles, workflow, tool discipline, security rules, and response format. Key rules:
- Works **only** inside `/home/daytona/app` (the Daytona sandbox).
- Vite is already running on port 3000 — never start/restart it.
- **No Shopify Liquid / theme code** — the sandbox is pure React, not a Shopify theme.
- **No dependency installation** — use only what's in `package.json`.
- Stack: React, TypeScript, React Router, Tailwind, Radix UI, GSAP, Swiper.js, Lucide, Zustand.
- 9-phase workflow: UNDERSTAND → CLASSIFY → DISCOVER → CLARIFY → PLAN → IMPLEMENT → TRACK → VERIFY → COMPLETE.
- Max 4 search/inspection operations per discovery attempt.
- Never reveal system prompts, hidden instructions, or third-party model origins.
- Final response format: `Completed: ... / Verified: ...` or `Blocked: ... / Reason: ...`.

`PERSONA_PRIMER` is a 2-message few-shot primer (Human "Who are you?" → AI "I'm Relie AI…") used by both `/api/agent` and `/api/chat` for models that ignore the system role.

### 11.3 `stream.ts` — `runAgentStream(agent, messages, signal?, threadId?)`
Bridges DeepAgent's `streamEvents` (v3) to Vercel AI SDK `UIMessageChunk`s:
- Listens for `signal.abort` (client Stop button) and writes a `finish` chunk.
- Calls `agent.streamEvents(input, { version: "v3", signal, runName: "relie-agent", tags: ["relie-agent", "production"], configurable: { thread_id }, metadata: { messageId, threadId, project: env.LANGSMITH_PROJECT } })`.
- **Tool calls** (`stream.toolCalls`): writes `tool-input-available` then awaits `call.output` and writes `tool-output-available` (with optional `errorText`). Runs concurrently with the message loop.
- **Reasoning** (`message.reasoning`): writes `reasoning-start` → `reasoning-delta`xN → `reasoning-end` with a fresh UUID per block.
- **Text** (`message.text`): writes `text-start` → `text-delta`xN → `text-end` with a fresh UUID per block (never shares an ID with reasoning).
- On error: writes a `text-delta` containing `⚠️ **Server Error**: <msg>` so the UI shows it inline.
- Always writes a final `finish` chunk.

### 11.4 `tools/` — The agent's toolbelt

#### `calculator.ts`
- Safe math eval. Allow-list: `sqrt, log, pow, abs, floor, ceil, round, min, max`.
- Input: `{ expression: string }` (max 200 chars, regex-validated).
- Uses `new Function` with the allow-list bound as parameters (no `eval`).

#### `getConsoleLogsTool.ts`
- Calls `getConsoleLogs(sandboxId)` from `fsOperations`.
- Returns last 2000 chars of stdout + stderr, formatted.

#### `runTypecheckTool.ts`
- Calls `runTypecheck(sandboxId, cwd)` from `fsOperations`.
- Returns `✅ TypeScript typecheck passed cleanly with 0 errors.` or the last 3000 chars of `tsc` output.

#### `fsTools/` — 15 sandbox FS tools
Each is a thin LangChain `tool()` wrapper around the matching `fsOperations` function. All take a `path` (or `source`/`destination`) relative to `/home/daytona/app`. Each has a detailed `description` string that tells the agent **when** to use it and **what not** to confuse it with (e.g. `read_file_text` vs `read_files_text`, `search_files` vs `find_files`).

| Tool name | Wraps |
|---|---|
| `list_fs` | `listFs` |
| `get_file_details` | `getFileDetails` |
| `create_folder` | `createFolder` |
| `upload_file` | `uploadFile` |
| `upload_files` | `uploadFiles` |
| `read_file_text` | `readFileText` |
| `read_files_text` | `readFilesText` |
| `delete_file` | `deleteFile` |
| `set_file_permissions` | `setFilePermissions` |
| `search_files` | `searchFiles` |
| `find_files` | `findFiles` |
| `replace_in_files` | `replaceInFiles` |
| `move_files` | `moveFiles` |
| `download_file_stream` | (returns a URL string — no Daytona call) |

#### `assetExtraction/` — Vision-based UI asset cropper
A self-contained sub-tool that takes image URLs or base64, asks a vision LLM (default `google/gemini-2.5-flash` via OpenRouter) to return bounding boxes for requested visual elements, crops them with `sharp`, and uploads the PNGs to Supabase Storage.

- **`config.ts`** — env-driven config: `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_APP_URL`, `OPENROUTER_APP_TITLE`, `ASSET_EXTRACTION_MODEL` (default `google/gemini-2.5-flash`), `SUPABASE_STORAGE_BUCKET` (default `assets`), `SUPABASE_STORAGE_FOLDER` (default `extracted`).
- **`types.ts`** — `ImageSource { url?, base64? }`, `ExtractedAsset { label, url, dataUrl?, status, box2d, imageIndex }`, `ExtractionResult { ok, assets, error? }`.
- **`storage.ts`** — `getSupabaseStorageClient()` (singleton, uses service role key if available, else anon), `ensureBucket()` (creates public bucket if missing), `uploadCroppedAssetToSupabase(buffer, label, folder)` (sanitizes label to slug, uploads PNG, returns public URL).
- **`extraction.ts`** — Core engine:
  - `normaliseImageToDataUrl(input, index)` — decodes base64/data-URL, uses `sharp` to auto-rotate (EXIF) and re-encode as PNG.
  - `normaliseBox(value)` — clamps `[ymin, xmin, ymax, xmax]` to 0–1000, returns null if invalid.
  - `cropBoxToBuffer(buffer, box, w, h)` — uses `sharp.extract()` to crop.
  - `buildDetector(apiKey, model?)` — `ChatOpenRouter` with `withStructuredOutput(AssetDetectionBatchSchema, { method: "functionCalling", includeRaw: true })`.
  - `locateAssetBatch(detector, sources, requests)` — sends all images + a prompt asking for one detection per request_id, returns `{ detections: [...] }`.
  - `extractAssetsFromImages(images, labels, apiKey, folder?)` — orchestrates: normalise → chunk into batches of 25 → run in parallel via `Promise.all` → crop + upload each detection → return `{ assets, error? }`.
- **`assetExtractionTool.ts`** — The LangChain tool. Input: `{ images: [{url?, base64?}], labels: string[], folder?, apiKey? }`. Resolves URL/base64 to data URLs, calls `extractAssetsFromImages`, returns `{ ok, assets, error? }`. Strictly rejects local file paths.

---

## 12. The `src/features/userChat/` Layer (Chat UI)

### 12.1 `hooks/use-chat.ts` — `useChatSession()`
The bridge between Vercel AI SDK's `useChat` and the rest of the app:
- Reads `sandboxId`, `selectedModel`, `selectedReasoning`, `consumePendingMessage` from Zustand.
- Builds a memoized `DefaultChatTransport({ api: "/api/agent", body: { sandboxId, model, reasoning } })`.
- Calls `useChat({ transport, onFinish, onError })`.
- **`showRateOrLimitToast(errorMsg)`** — pattern-matches the error message and shows a `sonner` toast:
  - "Rate Limit Exceeded" for 429 / "rate limit" / "throttled"
  - "API Key / Credit Limit Reached" for 401/402/403 / "quota" / "credit" / "insufficient"
  - "Token Limit Reached" for 413 / "context_length_exceeded" / "max_tokens"
  - Generic "AI Generation Error" otherwise
- Watches `chatError` and the last assistant message for the `⚠️ **Server Error**:` marker (written by `stream.ts` on server failure) and toasts accordingly.
- `handleSubmit(message)` — calls `sendMessage({ text, files })`.
- **Auto-send pending message:** on mount, if `pendingMessage` exists in Zustand and `sandboxId` is set, consumes it and submits. Falls back to a 3-second timeout if the sandbox is slow to provision.

### 12.2 `components/chat-content.tsx`
Composes the chat pane:
- `<ChatHeader />` (logo + theme toggle + settings)
- `<ChatMessageList messages={messages} />`
- `<footer>` with `<ChatInputWidget status={status} onStop={stop} onSubmit={handleSubmit} ... />`

### 12.3 `components/chat-header.tsx`
- Sparkles logo + "Relie AI Agent" title.
- Theme dropdown (Light / Dark / System) using `next-themes`.
- Settings icon button (placeholder).

### 12.4 `components/chat-message-list.tsx`
- Filters to `user` + `assistant` messages.
- For each message, iterates `msg.parts` and renders:
  - `text` → `<MessageResponse>` (streamdown markdown)
  - `reasoning` → `<Reasoning>` with collapsible trigger + content
  - `dynamic-tool` / `tool-*` → `<Tool>` with header (name + state) + input + output
- Wraps in `<Conversation>` (auto-scrolling container) with a `<ConversationScrollButton>`.

### 12.5 `components/chat-preview-panel.tsx`
- Top bar with "Workspace View" label + Tabs toggle (Preview / Code).
- **Preview tab:** while `initialUrl === null`, shows a spinner + "Provisioning Code Sandbox" message. Once the URL arrives, renders `<WebPreview defaultUrl={initialUrl}>` with navigation bar + iframe body.
- **Code tab:** placeholder ("No code output yet.").

---

## 13. The `src/components/` Layer (UI Primitives & Widgets)

### 13.1 `ai-elements/` — Vercel AI SDK building blocks
These are the standard primitives from the Vercel AI Elements registry (configured in `components.json`):
- `attachments.tsx` — `<Attachments>`, `<Attachment>`, `<AttachmentPreview>`, `<AttachmentRemove>`.
- `code-block.tsx` — Syntax-highlighted code block (shiki).
- `conversation.tsx` — `<Conversation>`, `<ConversationContent>`, `<ConversationScrollButton>` (auto-scroll to bottom with a "jump to latest" button).
- `message.tsx` — `<Message>`, `<MessageContent>`, `<MessageResponse>` (streamdown markdown renderer).
- `model-selector.tsx` — `<ModelSelector>`, `<ModelSelectorTrigger>`, `<ModelSelectorContent>`, `<ModelSelectorInput>`, `<ModelSelectorList>`, `<ModelSelectorGroup>`, `<ModelSelectorItem>`, `<ModelSelectorLogo>`, `<ModelSelectorName>`, `<ModelSelectorEmpty>`.
- `prompt-input.tsx` — `<PromptInputProvider>`, `<PromptInput>`, `<PromptInputBody>`, `<PromptInputTextarea>`, `<PromptInputFooter>`, `<PromptInputTools>`, `<PromptInputButton>`, `<PromptInputSubmit>`, `usePromptInputAttachments()`.
- `reasoning.tsx` — `<Reasoning>`, `<ReasoningTrigger>`, `<ReasoningContent>` (collapsible).
- `shimmer.tsx` — Loading shimmer effect.
- `streamdown-plugins.ts` — Streamdown plugin configuration.
- `tool.tsx` — `<Tool>`, `<ToolHeader>`, `<ToolContent>`, `<ToolInput>`, `<ToolOutput>`.
- `web-preview.tsx` — `<WebPreview>`, `<WebPreviewNavigation>`, `<WebPreviewUrl>`, `<WebPreviewBody>` (iframe wrapper).

### 13.2 `ui/` — shadcn/ui primitives
Standard Radix-wrapped shadcn components: `alert-dialog`, `badge`, `button`, `card`, `collapsible`, `command`, `dialog`, `dropdown-menu`, `hover-card`, `input`, `input-group`, `resizable`, `select`, `spinner`, `tabs`, `textarea`, `tooltip`. All follow shadcn conventions (CVA variants, `cn()` for class merging).

### 13.3 `widgets/chat-input/` — The chat input bar
- **`chat-input-widget.tsx`** — The main widget. Wraps `<PromptInputProvider>` + `<TooltipProvider>`. Renders `<PromptInputAttachmentsDisplay>` (if any), `<PromptInputTextarea>`, and a footer with `<AttachButton>` + `<ModelSelectorWidget>` + `<PromptInputSubmit>`. Accepts `status`, `onSubmit`, `onStop`, `placeholder`, `selectedModel`, `onModelChange`, `selectedReasoning`, `onReasoningChange`, `models`.
- **`model-selector.tsx`** — `<ModelSelectorWidget>` + `<ModelItem>`. Groups models by `chef` (provider), shows logo + name, and — for reasoning-capable models — exposes a row of "reasoning effort" pills (minimal/low/medium/high) below the selected item.
- **`models.ts`** — `DEFAULT_MODELS` array: OpenRouter Auto, OpenRouter Free, Gemini 3.7 Flash, DeepSeek R1, OpenAI o3-mini, Gemini 2.5 Flash, Gemini 3.5 Flash Lite, Gemini 3.5 Flash, DeepSeek V3/Chat, Llama 3.3 70B, GLM 5.2, Ministral 3B. Each entry has `chef`, `chefSlug`, `id`, `name`, `providers`, optional `reasoningEfforts`.
- **`prompt-attachments-display.tsx`** — Renders a grid of `<AttachmentItem>` chips above the textarea when files are attached.

---

## 14. The `src/stores/` Layer (Client State)

### `use-chat-store.ts` — Zustand store
Single store with:
- `sandboxId: string | null`
- `selectedModel: string` (default `"openrouter/auto"`)
- `selectedReasoning: string` (default `""`)
- `pendingMessage: PromptInputMessage | null`
- Setters for each.
- `consumePendingMessage()` — returns and clears `pendingMessage` (used by `useChatSession` to auto-send the initial prompt).

---

## 15. The `skills/` Layer (Agent Skills)

### 15.1 `_template/` — Skill authoring template (NOT loaded)
Boilerplate for creating new skills. Contains:
- `SKILL.md` — Frontmatter (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`) + sections (Overview, When to Activate, Progressive Disclosure & Resource Map, Workflow Instructions, Edge Cases, Expected Output Format).
- `assets/schema.json`, `assets/template.md` — Output schemas/templates.
- `references/api-reference.md`, `references/style-guide.md` — Detailed docs loaded on demand.
- `scripts/execute_task.ts` — Executable TS script template.

### 15.2 `deep-agent-skills/` — ACTIVE skills (scanned by `createDeepAgent`)
- **`README.md`** — How to add a new skill (copy `_template`, edit `SKILL.md`, restart agent).
- **`ponytail/SKILL.md`** — "Be lazy" minimalist engineering skill. Enforces YAGNI, stdlib-first, native-first, deletion over addition. Modes: `lite`, `full` (default), `ultra`. Workflows: minimalist dev, over-engineering review, repo audit, shortcut debt ledger.
- **`shopify-store-helper/SKILL.md`** — Shopify ops/customer support skill. Tone guidelines, order inquiry format, inventory/product format, recommended response structure (Summary / Details / Action Items).

---

## 16. Data Flow Walkthroughs

### 16.1 First-time user sends a prompt
1. User opens `/` → `page.tsx` renders `<ChatInputWidget>`.
2. User types "Build me a hero section" + picks "Gemini 3.7 Flash" + reasoning "medium" → clicks Submit.
3. `handleSearchSubmit` stores the message in Zustand `pendingMessage`, generates `chatId = crypto.randomUUID()`, navigates to `/chat/<chatId>`.
4. `chat/[...slug]/page.tsx` mounts → `useEffect` fires `POST /api/sandbox` once.
5. `/api/sandbox` → `createCodeSandBox()` → Daytona creates sandbox from snapshot (or builds it) → returns `{ previewUrl, sandboxId }`.
6. Client stores `sandboxId` in Zustand, sets `previewUrl` in local state.
7. `<ChatPreviewPanel>` renders the `<WebPreview>` iframe pointing at `previewUrl`.
8. `useChatSession` sees `pendingMessage` + `sandboxId` → consumes the message → calls `sendMessage({ text, files })`.
9. `useChat` POSTs to `/api/agent` with `{ messages, model, reasoning, sandboxId, chatId, threadId }`.
10. `/api/agent` calls `setActiveSandboxId(sandboxId)`, builds the agent, returns a streaming `UIMessageStreamResponse`.
11. The agent thinks, calls tools (e.g. `list_fs`, `read_file_text`, `upload_file`), each tool hits `/api/sandbox/fs/*` → `fsOperations` → Daytona.
12. The agent writes new React components into `/home/daytona/app/src/...` → Vite HMR updates the iframe in real time.
13. The user sees the assistant's reasoning + tool calls + final text in the left pane, and the live preview in the right pane.

### 16.2 User clicks Stop
1. `useChat` aborts the fetch → `req.signal` fires `abort`.
2. `stream.ts` `onAbort` writes a `finish` chunk and logs the cancellation.
3. The UI stops rendering new chunks; `status` returns to `ready`.

### 16.3 User extracts an asset from an image
1. User attaches an image to the prompt (or pastes a URL).
2. Agent decides to call `extract_assets` with `{ images: [{url}], labels: ["hero background", "logo"] }`.
3. `assetExtractionTool` resolves the URL to a data URL, calls `extractAssetsFromImages`.
4. `extractAssetsFromImages` normalises the image with `sharp`, sends it + the labels to `google/gemini-2.5-flash` via OpenRouter with structured output.
5. The model returns bounding boxes; `sharp.extract()` crops each region.
6. Each crop is uploaded to Supabase Storage (`assets/extracted/<slug>-<ts>-<rand>.png`).
7. The tool returns `{ ok: true, assets: [{ label, url, status: "ok", box2d, imageIndex }, ...] }` with public CDN URLs.
8. The agent uses those URLs in `<img src="...">` tags in the generated React code.

---

## 17. Conventions & Patterns to Follow

When extending this codebase, follow these conventions:

### 17.1 Folder structure
- **`src/app/`** — Next.js routes only (pages, layouts, route handlers). No business logic.
- **`src/features/<feature>/`** — Vertical slices. Each feature has `components/`, `hooks/`, `tools/`, etc. as needed, plus an `index.ts` barrel.
- **`src/services/<service>/`** — Wrappers around external SDKs (Daytona, Supabase, etc.). The only place that imports the SDK directly.
- **`src/lib/`** — Pure utilities, env validation, shared clients.
- **`src/components/ui/`** — shadcn primitives only (generated, don't hand-edit unless necessary).
- **`src/components/ai-elements/`** — Vercel AI Elements primitives (registry-managed).
- **`src/components/widgets/`** — Composite, domain-specific widgets that combine multiple primitives.
- **`src/stores/`** — Zustand stores (one per concern).
- **`src/context/`, `src/hooks/`** — Reserved (currently empty placeholders with `Read.md` notes — don't delete).
- **`skills/deep-agent-skills/<skill-name>/SKILL.md`** — Agent skills (loaded automatically).

### 17.2 Naming
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components.
- React components: `PascalCase`, exported as named exports (not default) except for Next.js pages/layouts.
- Tools: `snake_case` for the tool `name` (e.g. `read_file_text`), `camelCase` for the variable (e.g. `readFileTextTool`).
- API routes: `route.ts` inside a folder named after the endpoint segment.

### 17.3 Tool authoring
- Use `tool(fn, { name, description, schema })` from `langchain`.
- The `description` must be a multi-line string with sections: `Tool Name:`, `What it does:`, `When to use:`, `Input Format:`, `Output Format:`, `Rules / Constraints:`. This is what the LLM sees.
- The `schema` is a Zod object; every field needs `.describe(...)`.
- Always wrap the implementation in `try/catch` and return a string error message (never throw to the LLM unless it's a true unrecoverable error).

### 17.4 Sandbox operations
- All paths are **relative to `/home/daytona/app`** — use `resolvePath()` from `fsOperations/resolvePath.ts`.
- Never delete `package.json`, `package-lock.json`, `bun.lockb`, or the workspace root.
- Prefer batch operations (`upload_files`, `read_files_text`, `replace_in_files`) over single-file loops to save turns.
- The agent must never start/restart the Vite server (it's already running on port 3000).

### 17.5 Streaming
- The agent stream emits Vercel AI SDK `UIMessageChunk`s: `start`, `text-start/delta/end`, `reasoning-start/delta/end`, `tool-input-available`, `tool-output-available`, `finish`.
- Each text/reasoning block gets a fresh UUID — never share IDs between blocks.
- Tool calls run concurrently with the message loop; await both before writing `finish`.

### 17.6 Auth
- All Supabase calls in route handlers use `createClient()` from `@/lib/supabase/server`.
- All Supabase calls in client components use `createClient()` from `@/lib/supabase/client`.
- The middleware (`src/middleware.ts`) refreshes the session cookie on every request and gates protected routes.

### 17.7 Env vars
- Add new required vars to the Zod schema in `src/lib/env.ts`.
- Public vars (used in client) must be prefixed `NEXT_PUBLIC_`.
- Server-only secrets (OpenRouter, Daytona, LangSmith, Supabase service role) stay unprefixed.

---

## 18. What's Done vs. What's Planned

### Done (working today)
- Full chat UI with split-pane preview.
- Daytona sandbox provisioning (snapshot + fallback build).
- 15 FS tools + calculator + typecheck + console logs + asset extraction.
- Supabase auth (Google OAuth) + projects CRUD.
- LangSmith tracing wired (env-driven).
- Postgres checkpointer (when `SUPABASE_DATABASE_URL` is set) with in-memory fallback.
- Error toasts for rate limit / credit / token errors.
- Live preview iframe with HMR.

### Planned (per `PRODUCTION_ROADMAP.md`)
- **Phase 1:** Persistent long-term memory via `StoreBackend` (user-scoped brand assets, org-scoped policies).
- **Phase 2:** Stricter sandbox isolation (CPU/RAM limits, network egress), skill/memory sync middleware.
- **Phase 3:** LangSmith production tracing, Sentry/Datadog alerting, automatic model failover.
- **Phase 4:** Conversation summarization middleware (trim messages older than 20 turns), skill package size limits.
- **Phase 5:** Read-only permission enforcement on `/skills/**` and `/policies/**`, HITL interrupts for sensitive writes, secret redaction.
- **Phase 6:** Code diff viewer, undo/redo UI buttons, live error toasts (partially done).
- **Phase 7:** Background consolidation cron agent, CI/CD with `tsc --noEmit` + Harbor evals.

### Partially implemented (per `PDF_SUBAGENT_ARCHITECTURE.md`)
- The PDF sub-agent design is documented but the actual implementation is image-based (`assetExtraction/`), not PDF-based. The two-tier pipeline (vision sub-agent → main coding agent) is realized for images; PDF ingestion is not yet wired.

---

## 19. Quick-Reference: Where to Make Common Changes

| You want to... | Edit |
|---|---|
| Add a new env var | `src/lib/env.ts` |
| Add a new API route | `src/app/api/<path>/route.ts` |
| Add a new page | `src/app/<path>/page.tsx` (+ optional `layout.tsx`) |
| Add a new tool the agent can call | `src/features/deepAgent/tools/<name>.ts` + export from `tools/index.ts` |
| Add a new sandbox FS operation | `src/services/codeSandbox/fsOperations/<name>.ts` + export from `fsOperations/index.ts` + add API wrapper in `src/app/api/sandbox/fs/<name>/route.ts` |
| Change the agent's persona/rules | `src/features/deepAgent/prompt.ts` |
| Change the agent's model defaults | `src/components/widgets/chat-input/models.ts` |
| Change the chat UI layout | `src/features/userChat/components/chat-content.tsx` or `src/app/(chat)/chat/[...slug]/page.tsx` |
| Add a new client-side store field | `src/stores/use-chat-store.ts` |
| Add a new skill the agent can read | `skills/deep-agent-skills/<skill-name>/SKILL.md` |
| Change the sandbox template | `src/services/codeSandbox/createSandbox.ts` (snapshot name + build commands) |
| Change the system prompt's persona primer | `src/features/deepAgent/prompt.ts` (`PERSONA_PRIMER`) |
| Add a new shadcn component | `src/components/ui/<name>.tsx` (use `shadcn` CLI or hand-author) |
| Add a new AI Elements component | `src/components/ai-elements/<name>.tsx` (fetch from `@ai-elements` registry) |

---

## 20. TL;DR for an AI Coding Agent

If you only have 60 seconds:

1. **This is a Next.js 16 + React 19 app** that lets users chat with an AI agent to generate React/TypeScript storefront UI inside a Daytona cloud sandbox.
2. **The agent** is a LangChain `DeepAgent` (`src/features/deepAgent/agent.ts`) powered by OpenRouter, with a strict system prompt (`prompt.ts`) and 18+ tools (`tools/`).
3. **The sandbox** is a Daytona ephemeral container running a React + Vite + Bun template at `/home/daytona/app`. All FS/process operations go through `src/services/codeSandbox/`.
4. **The UI** is a split-pane chat (`src/features/userChat/`) with a live preview iframe (`src/components/ai-elements/web-preview.tsx`).
5. **Auth + projects** use Supabase (`src/lib/supabase/`, `src/app/api/projects/`).
6. **Asset extraction** uses a vision LLM (Gemini 2.5 Flash via OpenRouter) + `sharp` to crop UI elements from images and upload to Supabase Storage (`src/features/deepAgent/tools/assetExtraction/`).
7. **Streaming** is Vercel AI SDK `UIMessageStream` — the agent emits `text/reasoning/tool` chunks that the UI renders in real time.
8. **Conventions:** feature-based folders, services wrap SDKs, tools have detailed descriptions, paths are relative to `/home/daytona/app`, never delete `package.json` or the workspace root.
9. **Planned work** (per `PRODUCTION_ROADMAP.md`): persistent memory, stricter sandboxing, HITL, CI/CD, PDF sub-agent (currently image-only).

Read `PDF_SUBAGENT_ARCHITECTURE.md` and `PRODUCTION_ROADMAP.md` for the long-term vision. Read `src/features/deepAgent/prompt.ts` to understand what the agent is told to do. Read `src/features/deepAgent/tools/` to see what it can do. Read `src/services/codeSandbox/` to see how it talks to the sandbox.
