# Deep Agent

Deep Agents (`deepagents`) harness built on top of LangChain + LangGraph.
Exposes a tool-using Relie persona through `POST /api/agent` and the existing
`useChat` chat UI.

## Files

```
features/deepAgent/
├── index.ts               barrel
├── agent.ts               buildRelieAgent({ model, reasoning }) -> DeepAgent
├── prompt.ts              SYSTEM_PROMPT + PERSONA_PRIMER (shared with /api/chat)
├── stream.ts              agent.streamEvents v3 -> UIMessageStream
│                          (start/text-*/reasoning-*/tool-* chunks)
└── tools/calculator.ts    safe eval against an allow-list of Math functions
```

## Stream contract (what the UI receives)

`stream.ts` translates `agent.streamEvents(input, { version: "v3" })` into the
AI SDK 7 `UIMessageChunk` shape the chat UI consumes:

| Source projection | Emitted chunks |
|---|---|
| `stream.messages[i].text` | `text-start` -> `text-delta`xN -> `text-end` (per LLM message; skipped if no deltas) |
| `stream.messages[i].reasoning` | `reasoning-start` -> `reasoning-delta`xN -> `reasoning-end` (same shape, separate id) |
| `stream.toolCalls` | per call: `tool-input-available` (`name` + `input`) -> `tool-output-available` (`output`, optional `errorText`); tool lifecycle runs concurrent with the message loop |
| envelope | one `start` (with `messageId`) at the top, one `finish` at the bottom |

The `Reasoning` / `Tool` / `MessageResponse` blocks in
`features/userChat/components/chat-message-list.tsx` already render these
parts unchanged.

## API

```
POST /api/agent
body: { messages: UIMessage[], model: string, reasoning: string }
```

UI is already wired (see `use-chat.ts`).

## Skipped

- Streaming tool-input deltas (single chunk per call today). Switch to
  `message.toolCalls` when the UI needs a live "typing args..." feed.
- LangSmith tracing (off per request).
- Checkpointer / Store (stateless — add when you need cross-thread memory).
