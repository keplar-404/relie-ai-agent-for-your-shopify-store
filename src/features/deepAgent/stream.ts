import { createUIMessageStream } from "ai";
import type { DeepAgent } from "deepagents";
import { toBaseMessages } from "@ai-sdk/langchain";
import type { UIMessage } from "ai";
import { PERSONA_PRIMER_MESSAGES } from "./prompt";

// Bridges DeepAgent streamEvents (v3) projections -> Vercel AI SDK UI message chunks
// in arrival order across LLM turns.
//
// Inside each LLM message: reasoning opens -> reasoning-delta*N -> reasoning-end
// -> text opens -> text-delta*N -> text-end. Tool calls fire concurrently via
// stream.toolCalls and naturally land between LLM turns.
//
// ponytail: per-message reasoning-then-text keeps one block of each; tool lifecycle
// runs in its own async loop and races the message loop on the same writer.
export function runAgentStream(agent: DeepAgent, messages: UIMessage[]) {
  return createUIMessageStream({
    execute: async ({ writer }) => {
      const messageId = crypto.randomUUID();
      const baseMessages = await toBaseMessages(messages);
      const input = {
        messages: [...PERSONA_PRIMER_MESSAGES, ...baseMessages],
      };

      const stream = await agent.streamEvents(input, { version: "v3" });

      writer.write({ type: "start", messageId });

      // tool lifecycle runs concurrently with the message loop below
      const toolOutputs = (async () => {
        for await (const call of stream.toolCalls) {
          const toolCallId = crypto.randomUUID();
          writer.write({
            type: "tool-input-available",
            toolCallId,
            toolName: call.name,
            input: await call.input,
          });
          let output: unknown = "";
          let errorText: string | undefined;
          try {
            output = await call.output;
          } catch (err) {
            errorText = err instanceof Error ? err.message : String(err);
          }
          writer.write({
            type: "tool-output-available",
            toolCallId,
            output,
            ...(errorText ? { errorText } : {}),
          } as never);
        }
      })();

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
          writer.write({ type: "text-delta", id: textId, delta });
        }
        if (hadText) writer.write({ type: "text-end", id: textId });
      }

      await toolOutputs;
      writer.write({ type: "finish" });
    },
  });
}
