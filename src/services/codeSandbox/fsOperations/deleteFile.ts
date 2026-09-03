import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Deletes a file or directory (recursively if specified) from the sandbox workspace. */
export async function deleteFile(path?: string, recursive = false) {
  try {
    const sandbox = await getActiveSandbox();
    const resolvedPath = resolvePath(path);
    await sandbox.fs.deleteFile(resolvedPath, recursive);
    return `File deleted successfully from ${resolvedPath}`;
  } catch (error) {
    console.error("[fsOperations: deleteFile] Error:", error);
    throw error;
  }
}
