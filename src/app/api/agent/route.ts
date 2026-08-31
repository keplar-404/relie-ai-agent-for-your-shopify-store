import { createUIMessageStreamResponse } from "ai";
import type { UIMessage } from "ai";
import { buildRelieAgent } from "@/features/deepAgent/agent";
import { runAgentStream } from "@/features/deepAgent/stream";

export async function POST(req: Request) {
  const {
    messages,
    model,
    reasoning,
  }: {
    messages: UIMessage[];
    model: string;
    reasoning: string;
  } = await req.json();

  const agent = buildRelieAgent({ model, reasoning });
  return createUIMessageStreamResponse({
    stream: runAgentStream(agent, messages),
  });
}
