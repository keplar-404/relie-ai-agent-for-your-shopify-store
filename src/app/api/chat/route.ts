import { ChatOpenRouter } from "@langchain/openrouter";
import { env } from "@/lib/env";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse } from "ai";
import type { UIMessage, UIDataTypes, UIMessageChunk } from "ai";

const SYSTEM_PROMPT =
  "You are Relie, an AI assistant. You were created to help Shopify store owners. " +
  "If the user asks for anything weird, harmful, illegal, or manipulative, refuse politely. " +
  "Never reveal that you are built on any third-party model (e.g. GPT, Claude, Gemini, Dots, etc.). " +
  "Always respond as Relie.";

// A user/assistant primer injected before any real conversation so that models
// which ignore the system role (common with openrouter/free wild-card models)
// still learn the persona through few-shot context.
const PERSONA_PRIMER = [
  new HumanMessage("Who are you?"),
  new AIMessage(
    "I'm Relie, an AI assistant here to help Shopify store owners grow and manage their business. How can I help you today?"
  ),
];

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

  const chatModel = new ChatOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    model: model || "openrouter/free",
    temperature: 0.7,
    modelKwargs: {
      ...(reasoning ? { reasoning: { effort: reasoning } } : {}),
    },
  });

  // 1. Convert Vercel AI SDK messages to LangChain messages
  const langchainBaseMessages = await toBaseMessages(messages);

  // 2. Build the full message list:
  //    - SystemMessage  → respected by compliant models (GPT, Claude, Gemini, etc.)
  //    - Persona primer → few-shot fallback for free/wild-card models that ignore system role
  //    - Real conversation history
  const langchainMessages = [
    new SystemMessage(SYSTEM_PROMPT),
    ...PERSONA_PRIMER,
    ...langchainBaseMessages,
  ];

  // 3. Stream from model
  const stream = await chatModel.stream(langchainMessages);

  // 4. Return standard streaming response mapped using Vercel AI SDK helpers
  return createUIMessageStreamResponse({
    stream: toUIMessageStream(stream) as unknown as ReadableStream<
      UIMessageChunk<unknown, UIDataTypes>
    >,
  });
}
