/**
 * Supabase Storage integration for persisting cropped visual assets.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_STORAGE_BUCKET, SUPABASE_STORAGE_FOLDER } from "./config";

let supabaseClient: SupabaseClient | null = null;
let bucketChecked = false;

/**
 * Returns a configured Supabase client using server-side keys.
 */
export function getSupabaseStorageClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

/**
 * Ensures the target storage bucket exists (if permissions allow).
 */
async function ensureBucket(client: SupabaseClient, bucketName: string) {
  if (bucketChecked) return;
  bucketChecked = true;
  try {
    const { data: buckets } = await client.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucketName);
    if (!exists) {
      await client.storage.createBucket(bucketName, { public: true });
    }
  } catch {
    // If listing/creation fails (e.g. anon key with RLS), proceed anyway as bucket might already exist
  }
}

/**
 * Uploads a cropped image Buffer (PNG) to Supabase Storage and returns its public URL.
 *
 * @param buffer - Buffer containing the PNG image data
 * @param label - Human-readable label for generating a readable filename
 * @param folder - Folder path within the bucket (defaults to "extracted")
 * @returns Public URL string or null on failure
 */
export async function uploadCroppedAssetToSupabase(
  buffer: Buffer,
  label: string,
  folder: string = SUPABASE_STORAGE_FOLDER
): Promise<string | null> {
  const client = getSupabaseStorageClient();
  if (!client) {
    console.warn("[ASSET EXTRACTION] Supabase credentials not found. Returning dataUrl without storage upload.");
    return null;
  }

  await ensureBucket(client, SUPABASE_STORAGE_BUCKET);

  // Sanitize label to valid filename slug
  const sanitizedLabel =
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "asset";

  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileName = `${sanitizedLabel}-${Date.now()}-${randomSuffix}.png`;
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const filePath = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;

  const { error } = await client.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error(
      `❌ [ASSET EXTRACTION] Failed to upload asset to Supabase Storage (${SUPABASE_STORAGE_BUCKET}/${filePath}):`,
      error.message
    );
    return null;
  }

  const { data: publicUrlData } = client.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
