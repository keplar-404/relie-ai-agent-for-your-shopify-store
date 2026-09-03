import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Searches file contents for a matching text pattern in the sandbox workspace. */
export async function findFiles(pattern: string, path?: string) {
  try {
    const sandbox = await getActiveSandbox();
    return await sandbox.fs.findFiles(resolvePath(path), pattern);
  } catch (error) {
    console.error("[fsOperations: findFiles] Error:", error);
    throw error;
  }
}
