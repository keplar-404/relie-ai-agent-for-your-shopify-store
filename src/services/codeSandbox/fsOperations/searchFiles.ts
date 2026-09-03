import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Searches for file names matching a glob pattern in the sandbox workspace. */
export async function searchFiles(pattern = "*", path?: string) {
  try {
    const sandbox = await getActiveSandbox();
    return await sandbox.fs.searchFiles(resolvePath(path), pattern);
  } catch (error) {
    console.error("[fsOperations: searchFiles] Error:", error);
    throw error;
  }
}
