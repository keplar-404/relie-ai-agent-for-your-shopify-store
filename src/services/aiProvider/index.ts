import { env } from "@/lib/env";
import { ChatOpenRouter } from "@langchain/openrouter";
import tools from "@/features/ai/tools";

const openRotuerApiKey = env.OPENROUTER_API_KEY;

const model = new ChatOpenRouter({
  apiKey: openRotuerApiKey,
  model: "openai/gpt-oss-20b",
  temperature: 0,
  maxTokens: 1024,
  provider: { data_collection: "deny" },
}).bindTools(tools, { strict: true });

export default model;
