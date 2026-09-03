import type { DownloadStreamOptions } from "@daytona/sdk";
import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Downloads a file as a readable stream from the sandbox workspace. */
export async function downloadFileStream(
  path?: string,
  options?: DownloadStreamOptions,
) {
  try {
    const sandbox = await getActiveSandbox();
    return await sandbox.fs.downloadFileStream(resolvePath(path), options);
  } catch (error) {
    console.error("[fsOperations: downloadFileStream] Error:", error);
    throw error;
  }
}
