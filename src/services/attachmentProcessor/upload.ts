import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PDFS_BUCKET = process.env.SUPABASE_PDFS_BUCKET ?? "pdfs";
export const ATTACHMENTS_BUCKET = process.env.SUPABASE_ATTACHMENTS_BUCKET ?? "attachments";

let supabaseClient: SupabaseClient | null = null;
const checkedBuckets = new Set<string>();

/**
 * Returns a configured Supabase client using server-side keys.
 */
export function getSupabaseStorageClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or publishable/anon key)."
    );
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
 * Ensures a storage bucket exists with public access.
 */
export async function ensureBucket(bucketName: string): Promise<void> {
  if (checkedBuckets.has(bucketName)) return;
  checkedBuckets.add(bucketName);

  try {
    const client = getSupabaseStorageClient();
    const { data: buckets } = await client.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucketName);
    if (!exists) {
      await client.storage.createBucket(bucketName, { public: true });
    }
  } catch {
    // If listing/creation fails (e.g. non-admin service role or RLS), proceed as bucket may exist
  }
}

/**
 * Computes the next sequential PDF index for this project (e.g. user_pdf_1 -> 1).
 */
export async function getNextPdfIndex(projectId: string): Promise<number> {
  const client = getSupabaseStorageClient();
  await ensureBucket(PDFS_BUCKET);

  try {
    const { data: files } = await client.storage.from(PDFS_BUCKET).list(projectId);
    if (!files || files.length === 0) return 1;

    let maxIndex = 0;
    for (const item of files) {
      const match = item.name.match(/^user_pdf_(\d+)$/);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIndex) maxIndex = idx;
      }
    }
    return maxIndex + 1;
  } catch {
    return 1;
  }
}

/**
 * Computes the next sequential attachment index for images or text in this project.
 */
export async function getNextAttachmentIndex(
  projectId: string,
  kindPrefix: "image" | "text"
): Promise<number> {
  const client = getSupabaseStorageClient();
  await ensureBucket(ATTACHMENTS_BUCKET);

  try {
    const { data: files } = await client.storage.from(ATTACHMENTS_BUCKET).list(projectId);
    if (!files || files.length === 0) return 1;

    const regex = new RegExp(`^user_${kindPrefix}_(\\d+)\\.`);
    let maxIndex = 0;
    for (const item of files) {
      const match = item.name.match(regex);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIndex) maxIndex = idx;
      }
    }
    return maxIndex + 1;
  } catch {
    return 1;
  }
}

/**
 * Uploads a rendered PDF page PNG to the pdfs bucket.
 */
export async function uploadPdfPage(params: {
  projectId: string;
  pdfIndex: number;
  pageNumber: number;
  buffer: Buffer;
}): Promise<string> {
  const { projectId, pdfIndex, pageNumber, buffer } = params;
  const client = getSupabaseStorageClient();
  await ensureBucket(PDFS_BUCKET);

  const paddedPage = String(pageNumber).padStart(3, "0");
  const filePath = `${projectId}/user_pdf_${pdfIndex}/page-${paddedPage}.png`;

  const { error } = await client.storage
    .from(PDFS_BUCKET)
    .upload(filePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload PDF page to storage: ${error.message}`);
  }

  const { data } = client.storage.from(PDFS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Uploads an image or text file to the attachments bucket.
 */
export async function uploadAttachmentFile(params: {
  projectId: string;
  schemaName: string;
  ext: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string> {
  const { projectId, schemaName, ext, buffer, contentType } = params;
  const client = getSupabaseStorageClient();
  await ensureBucket(ATTACHMENTS_BUCKET);

  const cleanExt = ext.startsWith(".") ? ext : `.${ext}`;
  const filePath = `${projectId}/${schemaName}${cleanExt}`;

  const { error } = await client.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload attachment file to storage: ${error.message}`);
  }

  const { data } = client.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Recursively deletes all files in both pdfs and attachments buckets under projectId.
 */
export async function deleteProjectStorage(projectId: string): Promise<void> {
  const client = getSupabaseStorageClient();

  async function removeAllUnder(bucket: string, prefix: string) {
    try {
      const { data: items } = await client.storage.from(bucket).list(prefix);
      if (!items || items.length === 0) return;

      const filesToDelete: string[] = [];

      for (const item of items) {
        const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) {
          // It's a folder: recurse
          await removeAllUnder(bucket, itemPath);
        } else {
          filesToDelete.push(itemPath);
        }
      }

      if (filesToDelete.length > 0) {
        await client.storage.from(bucket).remove(filesToDelete);
      }
    } catch (err) {
      console.warn(`[STORAGE CLEANUP] Error deleting storage in bucket ${bucket} for ${prefix}:`, err);
    }
  }

  await Promise.all([
    removeAllUnder(PDFS_BUCKET, projectId),
    removeAllUnder(ATTACHMENTS_BUCKET, projectId),
  ]);
}

