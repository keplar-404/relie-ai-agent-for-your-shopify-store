import { createUIMessageStream } from "ai";
import type { DeepAgent } from "deepagents";
import { toBaseMessages } from "@ai-sdk/langchain";
import type { UIMessage } from "ai";
import { env } from "@/lib/env";
import { PERSONA_PRIMER_MESSAGES } from "./prompt";

// Bridges DeepAgent streamEvents (v3) projections -> Vercel AI SDK UI message chunks with AbortSignal cancellation support
export function runAgentStream(agent: DeepAgent, messages: UIMessage[], signal?: AbortSignal) {
  return createUIMessageStream({
    execute: async ({ writer }) => {
      const messageId = crypto.randomUUID();

      // Listen for client-side abort signal (e.g. Stop button click) to immediately cancel stream
      const onAbort = () => {
        console.log("\n🛑 [AGENT STREAM ABORTED BY USER]: OpenRouter API call cancelled, stopping generation...");
        try {
          writer.write({ type: "finish" });
        } catch {
          // Ignore writer closed errors
        }
      };

      if (signal?.aborted) {
        onAbort();
        return;
      }

      signal?.addEventListener("abort", onAbort, { once: true });

      try {
        const baseMessages = await toBaseMessages(messages);

        // Log incoming user message to server console
        const lastUserMsg = messages[messages.length - 1];
        const userText = Array.isArray(lastUserMsg?.parts)
          ? lastUserMsg.parts.map((p) => ("text" in p && typeof p.text === "string" ? p.text : "")).join(" ")
          : "";
        console.log("\n💬 [USER PROMPT TO AGENT]:", userText || "[Attachment/Empty]");

        const input = {
          messages: [...PERSONA_PRIMER_MESSAGES, ...baseMessages],
        };

        const stream = await agent.streamEvents(input, {
          version: "v3",
          signal,
          runName: "relie-agent",
          tags: ["relie-agent", "production"],
          metadata: {
            messageId,
            project: env.LANGSMITH_PROJECT,
          },
        });

        writer.write({ type: "start", messageId });

        const toolOutputs = (async () => {
          for await (const call of stream.toolCalls) {
            if (signal?.aborted) break;
            const toolCallId = crypto.randomUUID();
            const toolInput = await call.input;
            console.log(`\n🔧 [AGENT TOOL CALL] -> ${call.name}:`, toolInput);

            writer.write({
              type: "tool-input-available",
              toolCallId,
              toolName: call.name,
              input: toolInput,
            });
            let output: unknown = "";
            let errorText: string | undefined;
            try {
              output = await call.output;
              console.log(
                `✅ [AGENT TOOL RESULT] <- ${call.name}:`,
                typeof output === "string" && output.length > 300
                  ? `${output.slice(0, 300)}... (truncated log)`
                  : output,
              );
            } catch (err) {
              errorText = err instanceof Error ? err.message : String(err);
              console.error(`❌ [AGENT TOOL ERROR] <- ${call.name}:`, errorText);
            }
            writer.write({
              type: "tool-output-available",
              toolCallId,
              output,
              ...(errorText ? { errorText } : {}),
            } as never);
          }
        })().catch((err) => {
          console.error("❌ [AGENT TOOL STREAM EXCEPTION]:", err?.message || err);
        });

        let fullAiText = "";
        for await (const message of stream.messages) {
          if (signal?.aborted) break;

          // reasoning block (open + deltas + close)
          const reasoningId = crypto.randomUUID();
          let hadReasoning = false;
          for await (const delta of message.reasoning) {
            if (signal?.aborted) break;
            if (!hadReasoning) {
              writer.write({ type: "reasoning-start", id: reasoningId });
              hadReasoning = true;
            }
            writer.write({ type: "reasoning-delta", id: reasoningId, delta });
          }
          if (hadReasoning) writer.write({ type: "reasoning-end", id: reasoningId });

          // text block (always open a fresh id; never let text and reasoning share one)
          const textId = crypto.randomUUID();
          let hadText = false;
          for await (const delta of message.text) {
            if (signal?.aborted) break;
            if (!hadText) {
              writer.write({ type: "text-start", id: textId });
              hadText = true;
            }
            fullAiText += delta;
            writer.write({ type: "text-delta", id: textId, delta });
          }
          if (hadText) writer.write({ type: "text-end", id: textId });
        }

        await toolOutputs;

        if (fullAiText.trim() && !signal?.aborted) {
          console.log("\n🤖 [AGENT RESPONSE]:\n" + fullAiText + "\n");
        }

        if (!signal?.aborted) {
          writer.write({ type: "finish" });
        }
      } catch (error: any) {
        if (signal?.aborted || error?.name === "AbortError") {
          console.log("🛑 [AGENT STREAM CANCELED]: OpenRouter connection aborted.");
          return;
        }

        const errorMsg = error?.message || String(error);
        console.error("\n❌ [AGENT STREAM EXCEPTION]:", errorMsg);

        // Send feedback directly to live site interface
        const errTextId = crypto.randomUUID();
        writer.write({ type: "text-start", id: errTextId });
        writer.write({
          type: "text-delta",
          id: errTextId,
          delta: `\n\n> ⚠️ **Server Error**: ${errorMsg}\n> *Please check your API key, model selection, or network connection.*`,
        });
        writer.write({ type: "text-end", id: errTextId });
        writer.write({ type: "finish" });
      } finally {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
      }
    },
  });
}
