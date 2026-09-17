/**
 * Config for asset extraction tool and Supabase storage upload.
 */

export const OPENROUTER_API_KEY: string =
  process.env.OPENROUTER_API_KEY ?? "";

export const OPENROUTER_BASE_URL: string =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

export const OPENROUTER_APP_URL: string =
  process.env.OPENROUTER_APP_URL ?? "https://relie.ai";

export const OPENROUTER_APP_TITLE: string =
  process.env.OPENROUTER_APP_TITLE ?? "relie-ai-agent";

/** Bounding-box detection model via OpenRouter */
export const ASSET_EXTRACTION_MODEL: string =
  process.env.ASSET_EXTRACTION_MODEL ?? "google/gemini-2.5-flash";

/** Supabase Storage bucket name for extracted visual assets */
export const SUPABASE_STORAGE_BUCKET: string =
  process.env.SUPABASE_STORAGE_BUCKET ?? "assets";

/** Supabase Storage folder inside the bucket */
export const SUPABASE_STORAGE_FOLDER: string =
  process.env.SUPABASE_STORAGE_FOLDER ?? "extracted";
