# 🚀 Production-Grade AI Code Generation Platform Roadmap

This document outlines the complete technical roadmap and task checklist required to scale **Relie AI** into a production-grade, enterprise-ready AI code generation platform.

---

## 📌 Phase 1: Persistence & Database Infrastructure

- [ ] **1.1 Implement PostgreSQL Checkpointer (`PostgresSaver`)**
  - [ ] Replace local `MemorySaver` with `@langchain/langgraph-checkpoint-postgres`.
  - [ ] Provision PostgreSQL tables: `checkpoints`, `checkpoint_blobs`, and `checkpoint_writes`.
  - [ ] Enable session continuity so users can resume building sites across browser restarts using `thread_id`.
  - [ ] Implement Undo / Redo (Time Travel) capability by fetching previous `checkpoint_id` states.

- [ ] **1.2 Implement Persistent Long-Term Memory (`StoreBackend`)**
  - [ ] Connect `StoreBackend` with `PostgresStore` (or LangGraph Cloud Store).
  - [ ] Configure User-Scoped Memory (`namespace: ["user-memories", userId]`) to save merchant brand colors, fonts, logo assets, and coding preferences (`/memories/brand.md`).
  - [ ] Configure Org-Scoped Memory (`namespace: ["org-policies", orgId]`) for shared compliance policies.

---

## 📌 Phase 2: Sandboxing & Execution Security

- [ ] **2.1 Cloud Container Sandboxing (Daytona / E2B / Docker)**
  - [ ] Move execution off local server onto isolated cloud sandboxes (e.g. Daytona / Docker containers).
  - [ ] Enforce CPU/RAM limits and network egress restrictions per user sandbox.

- [ ] **2.2 Sandbox Skill & Memory Sync Middleware**
  - [ ] Implement `beforeAgent` custom middleware to sync backend skill files into sandbox containers before execution.
  - [ ] Implement `afterAgent` custom middleware to persist generated code changes back to storage.

---

## 📌 Phase 3: Observability, Tracing & Monitoring

- [ ] **3.1 LangSmith Tracing & Telemetry**
  - [ ] Configure `LANGSMITH_TRACING=true` and `LANGSMITH_PROJECT` in production env.
  - [ ] Audit tool invocation latencies, LLM token counts, and step costs per turn.

- [ ] **3.2 Error Alerting & Monitoring**
  - [ ] Monitor OpenRouter `429` (Rate Limit) and `402` (Credit Limit) errors in Sentry / Datadog.
  - [ ] Configure automatic model failover (e.g., fallback to Gemini 3.7 Flash if OpenRouter primary fails).

---

## 📌 Phase 4: Context Window Engineering & Cost Control

- [ ] **4.1 Automatic Message Trimming & Summarization**
  - [ ] Add conversation summarization middleware to summarize messages older than 20 turns.
  - [ ] Keep LLM prompt tokens under 10,000 per turn during 50+ turn sessions.

- [ ] **4.2 Skill Package Optimization**
  - [ ] Maintain `SKILL.md` files under 500 lines / 5,000 tokens.
  - [ ] Offload detailed schemas into `references/` for Level 3 on-demand reading.

---

## 📌 Phase 5: Security, Guardrails & Human-in-the-Loop

- [ ] **5.1 Read-Only Permissions Enforcement**
  - [ ] Enforce `mode: "deny"` permissions on `/skills/**` and `/policies/**`.
  - [ ] Prevent agents or prompt injections from modifying system skills or org policies.

- [ ] **5.2 Human-in-the-Loop (HITL) Interrupts**
  - [ ] Configure `interruptOn: { write_file: true, delete_file: true }` for sensitive production file paths.
  - [ ] Build a frontend approval modal to let merchants review and approve file edits before applying.

- [ ] **5.3 Input Sanitization & Secret Redaction**
  - [ ] Strip API keys, tokens, and credentials from telemetry logs and UI message streams.

---

## 📌 Phase 6: Frontend UI & Developer Experience

- [ ] **6.1 Code Diff Viewer**
  - [ ] Add a side-by-side Git-style diff viewer in the chat UI before accepting generated code.

- [ ] **6.2 Undo / Redo Controls**
  - [ ] Add UI buttons for "Undo Last AI Edit" connected to checkpoint parent states.

- [ ] **6.3 Live Error Toast Feedback**
  - [x] Catch `HTTP 402` (Credit limit), `HTTP 429` (Rate limit), and `HTTP 413` (Token limit) errors with `sonner` toasts.

---

## 📌 Phase 7: Deployment & DevOps

- [ ] **7.1 Background Consolidation Cron Agent**
  - [ ] Deploy a secondary consolidation agent running on a 6-hour cron schedule to synthesize chat threads into long-term memory.

- [ ] **7.2 CI/CD Automated Testing**
  - [ ] Add automated TypeScript type-check (`npx tsc --noEmit`) and unit tests to CI pipeline.
  - [ ] Run Harbor / Eval engineering test cases for agent code generation quality.
