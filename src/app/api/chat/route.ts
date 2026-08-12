import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { generateTextStream } from "@/services/aiProvider/openRouter/generateText";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Convert normal text to LangChain messages using vecel ai sdk
    const langchainMessages = await toBaseMessages(messages);

    // calling the ai llm via lanchaing open roture sdk
    const stream = await generateTextStream(langchainMessages);

    // steaming the response
    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream),
    });
  } catch (error) {
    return Response.json({ message: "API is not working" }, { status: 500 });
  }
}
