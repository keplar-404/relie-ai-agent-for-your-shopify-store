import { env } from "@/lib/env";
import { ChatOpenRouter } from "@langchain/openrouter";

const model = new ChatOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
  model: "openrouter/free",
  temperature: 0,
  maxTokens: 1024,
});

export default model;
