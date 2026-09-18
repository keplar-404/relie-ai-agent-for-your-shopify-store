import path from "node:path";

export type AttachmentKind = "pdf" | "image-native" | "image-other" | "text";

export interface ClassificationResult {
  kind: AttachmentKind;
  ext: string;
  mimeType: string;
}

const NATIVE_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/svg+xml",
]);

const NATIVE_IMAGE_EXTS = new Set([
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
]);

const TEXT_EXTS = new Set([
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".html",
  ".css",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".xml",
  ".yaml",
  ".yml",
  ".log",
]);

/**
 * Classifies an attachment by MIME type first, falling back to file extension.
 * Rejects unsupported file types by returning null.
 */
export function classifyAttachment(
  filename: string,
  mimeType?: string | null
): ClassificationResult | null {
  const cleanMime = (mimeType || "").trim().toLowerCase();
  const ext = path.extname(filename).toLowerCase();

  // 1. PDF detection
  if (cleanMime === "application/pdf" || ext === ".pdf") {
    return {
      kind: "pdf",
      ext: ext || ".pdf",
      mimeType: "application/pdf",
    };
  }

  // 2. Native image formats (uploaded as-is)
  if (NATIVE_IMAGE_MIMES.has(cleanMime) || NATIVE_IMAGE_EXTS.has(ext)) {
    return {
      kind: "image-native",
      ext: ext || (cleanMime === "image/svg+xml" ? ".svg" : ".png"),
      mimeType: cleanMime || (ext === ".svg" ? "image/svg+xml" : `image/${ext.replace(".", "")}`),
    };
  }

  // 3. Other image formats (converted to PNG with sharp)
  if (cleanMime.startsWith("image/") || [
    ".webp", ".gif", ".bmp", ".tiff", ".tif", ".heic", ".avif", ".ico", ".eps"
  ].includes(ext)) {
    return {
      kind: "image-other",
      ext: ext || ".png",
      mimeType: cleanMime || "image/png",
    };
  }

  // 4. Text formats (uploaded as-is)
  if (cleanMime.startsWith("text/") || TEXT_EXTS.has(ext)) {
    return {
      kind: "text",
      ext: ext || ".txt",
      mimeType: cleanMime || "text/plain",
    };
  }

  return null;
}

