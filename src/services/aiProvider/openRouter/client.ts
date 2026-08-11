import { ChatOpenRouter } from "@langchain/openrouter";
import { env } from "@/lib/env";

export const model = new ChatOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
    model: "openai/gpt-oss-20b",
    temperature: 0,
    maxTokens: 1024,
});


