import { createUIMessageStreamResponse } from "ai";
import type { UIMessage } from "ai";
import { buildRelieAgent } from "@/features/deepAgent/agent";
import { runAgentStream } from "@/features/deepAgent/stream";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  const {
    messages,
    model,
    reasoning,
    sandboxId,
  }: {
    messages: UIMessage[];
    model: string;
    reasoning: string;
    sandboxId?: string | null;
  } = await req.json();

  if (sandboxId) {
    console.log("[AGENT ROUTE] Received sandboxId:", sandboxId);
    setActiveSandboxId(sandboxId);
  } else {
    console.warn("[AGENT ROUTE] Warning: sandboxId missing from request payload!");
  }

  const agent = buildRelieAgent({ model, reasoning });
  return createUIMessageStreamResponse({
    stream: runAgentStream(agent, messages),
  });
}
