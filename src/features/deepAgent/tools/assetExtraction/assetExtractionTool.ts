/**
 * assetExtractionTool.ts — LangChain tool for screenshot asset extraction & Supabase Storage persistence.
 *
 * Accepts:
 *   images: Array<{ url?: string, base64?: string }> (strictly url or base64, NO filesystem paths)
 *   labels: Array<string> (descriptions of visual elements to extract)
 *   folder?: string (optional Supabase storage folder)
 *
 * Uploads all cropped assets to Supabase Storage and returns their public URLs.
 */

import { tool } from "langchain";
import { z } from "zod";
import { OPENROUTER_API_KEY, SUPABASE_STORAGE_FOLDER } from "./config";
import { extractAssetsFromImages } from "./extraction";
import type { ExtractionResult } from "./types";

// ---------------------------------------------------------------------------
// Strict Input Schema: ONLY url or base64, NO path
// ---------------------------------------------------------------------------

const ImageSourceSchema = z
  .object({
    url: z
      .string()
      .url()
      .optional()
      .describe("Publicly reachable HTTP/HTTPS image URL (fetched automatically)."),
    base64: z
      .string()
      .optional()
      .describe('Base64 image string or data-URL (e.g. "data:image/png;base64,...").'),
  })
  .refine((data) => Boolean(data.url || data.base64), {
    message: "Each image source must provide either a 'url' or 'base64' string.",
  });

const ExtractAssetsInputSchema = z.object({
  images: z
    .array(ImageSourceSchema)
    .min(1)
    .describe(
      "Array of source images to search. Each must contain strictly either 'url' or 'base64'. Local file paths are NOT accepted."
    ),
  labels: z
    .array(z.string())
    .min(1)
    .describe(
      'Array of visual asset descriptions to locate and extract, e.g. ["brand logo", "hero background", "add-to-cart button"].'
    ),
  folder: z
    .string()
    .optional()
    .describe("Optional target folder in Supabase Storage (defaults to 'extracted')."),
  apiKey: z
    .string()
    .optional()
    .describe("Optional OpenRouter API key override. Defaults to server environment OPENROUTER_API_KEY."),
});

// ---------------------------------------------------------------------------
// Image Source Resolver (URL fetch or Base64 pass-through)
// ---------------------------------------------------------------------------

async function resolveImageSource(
  img: z.infer<typeof ImageSourceSchema>,
  index: number
): Promise<string> {
  if (img.url) {
    const response = await fetch(img.url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image from URL at images[${index}] (${img.url}): ${response.statusText}`
      );
    }
    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/png";
    const arrayBuf = await response.arrayBuffer();
    const base64Str = Buffer.from(arrayBuf).toString("base64");
    return `data:${contentType};base64,${base64Str}`;
  }

  if (img.base64) {
    const raw = img.base64.trim();
    if (raw.startsWith("data:image/")) {
      return raw;
    }
    // Assume png format wrapper for raw base64
    return `data:image/png;base64,${raw}`;
  }

  throw new Error(`images[${index}] must supply either a 'url' or 'base64' property.`);
}

// ---------------------------------------------------------------------------
// The LangChain Tool
// ---------------------------------------------------------------------------

export const assetExtractionTool = tool(
  async ({
    images,
    labels,
    folder,
    apiKey,
  }: z.infer<typeof ExtractAssetsInputSchema>): Promise<ExtractionResult> => {
    const resolvedApiKey =
      apiKey || OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!resolvedApiKey) {
      return {
        ok: false,
        error:
          "OpenRouter API key is missing. Set OPENROUTER_API_KEY in your environment or provide apiKey.",
        assets: [],
      };
    }

    // Resolve URL / base64 image sources
    let rawImageData: string[];
    try {
      rawImageData = await Promise.all(
        images.map((img, i) => resolveImageSource(img, i))
      );
    } catch (err) {
      return {
        ok: false,
        error: String(err instanceof Error ? err.message : err),
        assets: [],
      };
    }

    // Filter and sanitize labels
    const cleanLabels = labels.map((l) => l.trim()).filter(Boolean);
    if (cleanLabels.length === 0) {
      return {
        ok: false,
        error: "At least one valid asset label must be provided.",
        assets: [],
      };
    }

    try {
      const targetFolder = folder || SUPABASE_STORAGE_FOLDER;
      const result = await extractAssetsFromImages(
        rawImageData,
        cleanLabels,
        resolvedApiKey,
        targetFolder
      );

      return {
        ok: !result.error,
        assets: result.assets,
        ...(result.error ? { error: result.error } : {}),
      };
    } catch (err) {
      return {
        ok: false,
        error: `Asset extraction failed: ${err instanceof Error ? err.message : String(err)}`,
        assets: [],
      };
    }
  },
  {
    name: "extract_assets",
    description: `Tool Name: extract_assets
What it does: Locates, precisely crops, and persists visual UI assets (logos, heroes, buttons, product images, icons) from screenshots or designs to Supabase Storage, returning their public URLs.
When to use: Use whenever the user provides an image URL or base64 image and wants to extract specific visual components for use in storefront UI development.
Input Format: JSON object:
  - images: Array of { url?: string, base64?: string } (strictly URL or base64, NO local file paths)
  - labels: Array of string descriptions of what to crop (e.g. ["brand logo", "hero background image"])
  - folder?: Optional folder inside Supabase Storage bucket (defaults to 'extracted')
Output Format:
  - On Success: JSON object { ok: true, assets: [{ label: string, url: string, status: "ok", box2d: [ymin, xmin, ymax, xmax] }] } where url is the public Supabase Storage URL.
  - On Error: JSON object { ok: false, error: string, assets: [] }
Rules / Constraints:
  - Strictly accepts only 'url' or 'base64'. Local file paths are NOT allowed.
  - Returns direct Supabase Storage public URLs for easy embedding in <img> or CSS.`,
    schema: ExtractAssetsInputSchema,
  }
);
