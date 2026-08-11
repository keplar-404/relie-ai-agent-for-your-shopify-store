// src/lib/env.ts
import { z } from "zod";

export const env = z
    .object({
        OPENROUTER_API_KEY: z.string().min(1),
        NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
    })
    .parse(process.env);
