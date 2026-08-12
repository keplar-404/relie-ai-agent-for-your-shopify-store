import { z } from "zod";

export const env = z
  .object({
    OPENROUTER_API_KEY: z.string(),
  })
  .parse(process.env);
