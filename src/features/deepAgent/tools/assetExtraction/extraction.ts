/**
 * extraction.ts — Core bounding-box detection + crop + Supabase storage engine.
 *
 * Uses:
 *   - @langchain/openrouter  (ChatOpenRouter, structured output)
 *   - sharp                  (image decode, EXIF normalisation, crop)
 *   - Supabase Storage       (persistence and public URL generation)
 */

import { ChatOpenRouter } from "@langchain/openrouter";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import sharp from "sharp";
import { z } from "zod";
import {
  ASSET_EXTRACTION_MODEL,
  OPENROUTER_APP_TITLE,
  OPENROUTER_APP_URL,
  OPENROUTER_BASE_URL,
} from "./config";
import { uploadCroppedAssetToSupabase } from "./storage";
import type { ExtractedAsset } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ASSETS_PER_REQUEST = 25;
const DEFAULT_IMAGE_DETAIL = "original";

const SYSTEM_INSTRUCTION =
  "You are a precise 2D object detector for screenshot asset extraction.\n" +
  "Return only one schema-valid JSON object. Never return masks, segmentation, " +
  "markdown fences, prose, or invented detections. " +
  "Process no more than 25 requested objects per response.";

// ---------------------------------------------------------------------------
// Zod schemas for structured output
// ---------------------------------------------------------------------------

const AssetDetectionSchema = z.object({
  request_id: z.string().describe(
    "The unchanged request_id from the corresponding input request."
  ),
  image_index: z.number().nullable().describe(
    "1-based source image number containing the requested asset, or null when absent."
  ),
  box_2d: z
    .array(z.number())
    .length(4)
    .nullable()
    .describe(
      "Tight [ymin, xmin, ymax, xmax] bounds normalised to 0-1000, or null."
    ),
  label: z.string().nullable().describe(
    "Short label distinguishing this occurrence from lookalikes, or null."
  ),
});

const AssetDetectionBatchSchema = z.object({
  detections: z
    .array(AssetDetectionSchema)
    .max(MAX_ASSETS_PER_REQUEST)
    .describe("Exactly one detection for every requested request_id."),
});

type AssetDetection = z.infer<typeof AssetDetectionSchema>;
type AssetDetectionBatch = z.infer<typeof AssetDetectionBatchSchema>;

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface SourceImage {
  dataUrl: string;
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
  imageIndex: number;
}

interface AssetRequest {
  requestId: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Image normalisation helpers (using sharp)
// ---------------------------------------------------------------------------

export async function normaliseImageToDataUrl(
  input: string,
  imageIndex: number
): Promise<SourceImage | null> {
  let encoded = input.trim();
  if (encoded.startsWith("data:image/") && encoded.includes(",")) {
    const [, base64Part] = encoded.split(",", 2) as [string, string];
    encoded = base64Part;
  }

  try {
    const imageBuffer = Buffer.from(encoded, "base64");
    if (imageBuffer.length === 0) return null;

    // sharp handles EXIF auto-rotation natively
    const instance = sharp(imageBuffer).rotate();
    const metadata = await instance.metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (width === 0 || height === 0) return null;

    // Normalise to PNG so vision models always receive a stable format
    const pngBuffer = await instance.png().toBuffer();
    const normalised = `data:image/png;base64,${pngBuffer.toString("base64")}`;

    return {
      dataUrl: normalised,
      buffer: pngBuffer,
      width,
      height,
      mimeType: "image/png",
      imageIndex,
    };
  } catch (err) {
    console.error("[ASSET EXTRACTION] Failed to decode and normalise image:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Bounding-box normalisation + crop
// ---------------------------------------------------------------------------

function normaliseBox(
  value: unknown
): [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 4) return null;

  const coords = value.map((v) => {
    if (typeof v !== "number" || !isFinite(v)) return null;
    return v;
  });
  if (coords.some((c) => c === null)) return null;

  const [rawYmin, rawXmin, rawYmax, rawXmax] = coords as number[];
  const ymin = Math.max(0, Math.min(1000, Math.min(rawYmin, rawYmax)));
  const ymax = Math.max(0, Math.min(1000, Math.max(rawYmin, rawYmax)));
  const xmin = Math.max(0, Math.min(1000, Math.min(rawXmin, rawXmax)));
  const xmax = Math.max(0, Math.min(1000, Math.max(rawXmin, rawXmax)));

  if (ymax <= ymin || xmax <= xmin) return null;
  return [ymin, xmin, ymax, xmax];
}

async function cropBoxToBuffer(
  sourceBuffer: Buffer,
  box2d: [number, number, number, number],
  width: number,
  height: number
): Promise<{ buffer: Buffer; dataUrl: string } | null> {
  try {
    const [ymin, xmin, ymax, xmax] = box2d;
    const left = Math.max(0, Math.min(width, Math.floor((xmin / 1000) * width)));
    const top = Math.max(0, Math.min(height, Math.floor((ymin / 1000) * height)));
    const right = Math.max(0, Math.min(width, Math.ceil((xmax / 1000) * width)));
    const bottom = Math.max(0, Math.min(height, Math.ceil((ymax / 1000) * height)));

    const extractWidth = right - left;
    const extractHeight = bottom - top;

    if (extractWidth <= 0 || extractHeight <= 0) return null;

    const croppedBuffer = await sharp(sourceBuffer)
      .extract({ left, top, width: extractWidth, height: extractHeight })
      .png()
      .toBuffer();

    return {
      buffer: croppedBuffer,
      dataUrl: `data:image/png;base64,${croppedBuffer.toString("base64")}`,
    };
  } catch (err) {
    console.error("[ASSET EXTRACTION] Failed to crop box:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Detection prompt builder
// ---------------------------------------------------------------------------

function buildDetectionPrompt(
  sources: SourceImage[],
  requests: AssetRequest[]
): string {
  const sourceMapping = sources
    .map(
      (src, i) =>
        `- attached image ${i + 1} = source image ${src.imageIndex} ` +
        `(${src.width}x${src.height} pixels after normalisation)`
    )
    .join("\n");

  const requestJson = JSON.stringify(
    requests.map((r) => ({ request_id: r.requestId, description: r.description })),
    null,
    2
  );

  return `Locate each requested visual asset in the attached source images.

SOURCE IMAGE MAPPING (image_index must use the 1-based source image number):
${sourceMapping}

REQUESTS:
${requestJson}

BOUNDING-BOX RULES:
- Return exactly one detections record per request, retaining each request_id unchanged.
- box_2d is [ymin, xmin, ymax, xmax], relative to the selected source image, normalised 0-1000.
- Return the smallest tight axis-aligned box containing the requested asset.
- Exclude surrounding container cards, backgrounds, padding, borders, or irrelevant text.
- If absent or ambiguous, return that request_id with image_index=null, box_2d=null, label=null.
- Return JSON only conforming to the schema.`;
}

// ---------------------------------------------------------------------------
// Batch detection call
// ---------------------------------------------------------------------------

function buildDetector(apiKey: string, model?: string) {
  const llm = new ChatOpenRouter({
    model: model ?? ASSET_EXTRACTION_MODEL,
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    temperature: 0.2,
    siteUrl: OPENROUTER_APP_URL,
    siteName: OPENROUTER_APP_TITLE,
  });

  return llm.withStructuredOutput(AssetDetectionBatchSchema, {
    method: "functionCalling",
    includeRaw: true,
  });
}

async function locateAssetBatch(
  detector: ReturnType<typeof buildDetector>,
  sources: SourceImage[],
  requests: AssetRequest[]
): Promise<AssetDetectionBatch> {
  const prompt = buildDetectionPrompt(sources, requests);

  const userContent: Array<Record<string, unknown>> = sources.map((src) => ({
    type: "image_url",
    image_url: { url: src.dataUrl, detail: DEFAULT_IMAGE_DETAIL },
  }));
  userContent.push({ type: "text", text: prompt });

  try {
    const output = await detector.invoke([
      new SystemMessage(SYSTEM_INSTRUCTION),
      new HumanMessage({ content: userContent as any }),
    ]);

    const parsed =
      typeof output === "object" && output !== null && "parsed" in output
        ? (output as any).parsed
        : output;

    const result = AssetDetectionBatchSchema.safeParse(parsed);
    return result.success ? result.data : { detections: [] };
  } catch (err) {
    console.error("[ASSET EXTRACTION] Detection API error:", err);
    return { detections: [] };
  }
}

// ---------------------------------------------------------------------------
// Public extraction function
// ---------------------------------------------------------------------------

export async function extractAssetsFromImages(
  imageData: string[],
  assetDescriptions: string[],
  apiKey: string,
  folder?: string
): Promise<{ assets: ExtractedAsset[]; error?: string }> {
  // Normalise all images
  const sourceImages: SourceImage[] = [];
  for (let i = 0; i < imageData.length; i++) {
    const src = await normaliseImageToDataUrl(imageData[i]!, i + 1);
    if (src) sourceImages.push(src);
  }

  if (sourceImages.length === 0) {
    return {
      assets: [],
      error: "No valid input images were available for asset extraction. Verify base64 or URL data.",
    };
  }

  if (assetDescriptions.length === 0) {
    return { assets: [] };
  }

  // Build requests with stable IDs
  const requests: AssetRequest[] = assetDescriptions.map((desc, i) => ({
    requestId: `asset-${String(i + 1).padStart(4, "0")}`,
    description: desc,
  }));

  // Chunk into batches of MAX_ASSETS_PER_REQUEST
  const chunks: AssetRequest[][] = [];
  for (let i = 0; i < requests.length; i += MAX_ASSETS_PER_REQUEST) {
    chunks.push(requests.slice(i, i + MAX_ASSETS_PER_REQUEST));
  }

  const detector = buildDetector(apiKey);

  // Run batches in parallel
  const batchResults = await Promise.all(
    chunks.map((chunk) => locateAssetBatch(detector, sourceImages, chunk))
  );

  // Collect detections by request ID
  const detectionMap = new Map<string, AssetDetection>();
  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci]!;
    const batch = batchResults[ci]!;
    const expectedIds = new Set(chunk.map((r) => r.requestId));
    for (const det of batch.detections) {
      if (expectedIds.has(det.request_id) && !detectionMap.has(det.request_id)) {
        detectionMap.set(det.request_id, det);
      }
    }
  }

  // Build final assets array with Supabase Storage upload
  const sourceByIndex = new Map(sourceImages.map((s) => [s.imageIndex, s]));
  const assets: ExtractedAsset[] = [];

  for (const req of requests) {
    const det = detectionMap.get(req.requestId);
    const imageIndex =
      det && typeof det.image_index === "number" && !Number.isNaN(det.image_index)
        ? det.image_index
        : null;
    const box = det?.box_2d ? normaliseBox(det.box_2d) : null;

    let storageUrl: string | null = null;
    let dataUrl: string | null = null;
    let status: "ok" | "missing" | "error" = "missing";

    if (imageIndex !== null && box !== null) {
      const src = sourceByIndex.get(imageIndex);
      if (src) {
        const crop = await cropBoxToBuffer(src.buffer, box, src.width, src.height);
        if (crop) {
          dataUrl = crop.dataUrl;
          // Upload cropped asset directly to Supabase Storage
          storageUrl = await uploadCroppedAssetToSupabase(
            crop.buffer,
            req.description,
            folder
          );
          status = "ok";
        } else {
          status = "error";
        }
      }
    }

    assets.push({
      label: req.description,
      url: storageUrl,
      dataUrl: storageUrl ? undefined : dataUrl, // If storage URL is available, avoid heavy base64 payload
      status,
      box2d: box,
      imageIndex,
    });
  }

  const hasError = assets.some((a) => a.status !== "ok");
  return {
    assets,
    ...(hasError
      ? { error: "Could not detect or crop bounding boxes for some requested assets." }
      : {}),
  };
}
