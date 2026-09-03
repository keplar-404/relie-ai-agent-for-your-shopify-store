import type { UploadSource, UploadStreamOptions } from "@daytona/sdk";
import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Uploads a binary or large file via streaming to avoid loading large files into memory. */
export async function uploadFileStream(
  source: UploadSource,
  path?: string,
  options?: UploadStreamOptions,
) {
  try {
    const sandbox = await getActiveSandbox();
    const resolvedPath = resolvePath(path);
    await sandbox.fs.uploadFileStream(source, resolvedPath, options);
    return `File stream uploaded successfully to ${resolvedPath}`;
  } catch (error) {
    console.error("[fsOperations: uploadFileStream] Error:", error);
    throw error;
  }
}
