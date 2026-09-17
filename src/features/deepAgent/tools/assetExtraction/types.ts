/**
 * Types for the asset extraction tool.
 */

/** One image source — strictly url or base64 (no local filesystem paths). */
export interface ImageSource {
  /** Publicly reachable http/https URL — fetched automatically. */
  url?: string;
  /** Base64 data-URL (e.g. "data:image/png;base64,...") or raw base64 string. */
  base64?: string;
}

/** One extracted asset in the result. */
export interface ExtractedAsset {
  /** The label/description supplied. */
  label: string;
  /** Public URL of the cropped asset saved in Supabase Storage. */
  url: string | null;
  /** Base64 PNG data-URL fallback or preview. */
  dataUrl?: string | null;
  /** "ok" | "missing" | "error" */
  status: "ok" | "missing" | "error";
  /** [ymin, xmin, ymax, xmax] normalised 0-1000, or null. */
  box2d: [number, number, number, number] | null;
  /** Which input image the asset was found in (1-based), or null. */
  imageIndex: number | null;
}

/** Return value of the asset extraction tool. */
export interface ExtractionResult {
  ok: boolean;
  assets: ExtractedAsset[];
  error?: string;
}
