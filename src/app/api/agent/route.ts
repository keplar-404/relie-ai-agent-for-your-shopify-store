import { createUIMessageStreamResponse } from "ai";
import type { UIMessage } from "ai";
import { buildRelieAgent } from "@/features/deepAgent/agent";
import { runAgentStream } from "@/features/deepAgent/stream";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const {
      messages,
      model,
      reasoning,
      sandboxId,
      chatId,
      threadId,
    }: {
      messages: UIMessage[];
      model: string;
      reasoning: string;
      sandboxId?: string | null;
      chatId?: string | null;
      threadId?: string | null;
    } = await req.json();

    if (sandboxId) {
      console.log("[AGENT ROUTE] Received sandboxId:", sandboxId);
      setActiveSandboxId(sandboxId);
    } else {
      console.warn("[AGENT ROUTE] Warning: sandboxId missing from request payload!");
    }

    // Extract authenticated user for per-user memory namespacing & observability
    const supabase = await createClient().catch(() => null);
    const userId =
      (await supabase?.auth.getUser().catch(() => ({ data: { user: null } })))
        ?.data?.user?.id ?? "anonymous";

    const agentContext = {
      userId,
      projectId: chatId ?? undefined,
      sandboxId: sandboxId ?? undefined,
    };

    const agent = await buildRelieAgent({ model, reasoning });
    const activeThreadId = threadId ?? chatId ?? undefined;

    return createUIMessageStreamResponse({
      stream: runAgentStream(agent, messages, req.signal, activeThreadId, agentContext),
    });

  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error("[AGENT ROUTE] Error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
