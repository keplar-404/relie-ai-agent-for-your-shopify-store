import { z } from "zod";

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  DAYTONA_API_KEY: z.string().min(1, "DAYTONA API KEY is required"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  // Add other required env vars here (e.g. NEXT_PUBLIC_API_URL)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  throw new Error(
    "Invalid environment variables. Check your .env configuration.",
  );
}

export const env = parsed.data;
