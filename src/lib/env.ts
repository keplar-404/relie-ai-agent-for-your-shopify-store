import { z } from "zod";

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(4, "OPENROUTER_API_KEY is required"),
  DAYTONA_API_KEY: z.string().min(4, "DAYTONA_API_KEY is required"),
  LANGSMITH_TRACING: z.string().default("true"),
  LANGSMITH_ENDPOINT: z.string().min(1, "LANGSMITH_ENDPOINT is required"),
  LANGSMITH_API_KEY: z.string().min(4, "LANGSMITH_API_KEY is required"),
  LANGSMITH_PROJECT: z.string().min(1, "LANGSMITH_PROJECT is required"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  throw new Error(
    "Invalid environment variables. Check your .env configuration.",
  );
}

// Ensure LangChain / LangSmith environment variables are set on process.env
process.env.LANGSMITH_TRACING = parsed.data.LANGSMITH_TRACING;
process.env.LANGSMITH_API_KEY = parsed.data.LANGSMITH_API_KEY;
process.env.LANGSMITH_PROJECT = parsed.data.LANGSMITH_PROJECT;
process.env.LANGSMITH_ENDPOINT = parsed.data.LANGSMITH_ENDPOINT;
export const env = parsed.data;
