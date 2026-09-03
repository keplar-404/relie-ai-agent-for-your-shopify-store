import type { FileUpload } from "@daytona/sdk";
import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Writes or updates multiple UTF-8 text files simultaneously in a single batch step inside the sandbox workspace. */
export async function uploadFiles(
  files: Array<{ source: string | Buffer; destination: string }>,
) {
  try {
    const sandbox = await getActiveSandbox();
    const payload: FileUpload[] = files.map((f) => ({
      source: typeof f.source === "string" ? Buffer.from(f.source) : f.source,
      destination: resolvePath(f.destination),
    }));
    await sandbox.fs.uploadFiles(payload);
    return `Files uploaded successfully: ${payload.map((p) => p.destination).join(", ")}`;
  } catch (error) {
    console.error("[fsOperations: uploadFiles] Error:", error);
    throw error;
  }
}
