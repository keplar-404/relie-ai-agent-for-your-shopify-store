import { createUIMessageStream } from "ai";
import type { DeepAgent } from "deepagents";
import { toBaseMessages } from "@ai-sdk/langchain";
import type { UIMessage } from "ai";
import { PERSONA_PRIMER_MESSAGES } from "./prompt";

// Bridges DeepAgent streamEvents (v3) projections -> Vercel AI SDK UI message chunks
export function runAgentStream(agent: DeepAgent, messages: UIMessage[]) {
  return createUIMessageStream({
    execute: async ({ writer }) => {
      const messageId = crypto.randomUUID();
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

        const stream = await agent.streamEvents(input, { version: "v3" });

        writer.write({ type: "start", messageId });

        // tool lifecycle runs concurrently with the message loop below
        const toolOutputs = (async () => {
          for await (const call of stream.toolCalls) {
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
        })();

        let fullAiText = "";
        for await (const message of stream.messages) {
          // reasoning block (open + deltas + close)
          const reasoningId = crypto.randomUUID();
          let hadReasoning = false;
          for await (const delta of message.reasoning) {
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

        if (fullAiText.trim()) {
          console.log("\n🤖 [AGENT RESPONSE]:\n" + fullAiText + "\n");
        }

        writer.write({ type: "finish" });
      } catch (error: any) {
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
      }
    },
  });
}
