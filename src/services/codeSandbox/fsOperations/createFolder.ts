import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Creates a directory with default permission mode ('775') in the sandbox workspace. */
export async function createFolder(path?: string) {
  try {
    const sandbox = await getActiveSandbox();
    const resolvedPath = resolvePath(path);
    await sandbox.fs.createFolder(resolvedPath, "775");
    return `Folder created successfully at ${resolvedPath}`;
  } catch (error) {
    console.error("[fsOperations: createFolder] Error:", error);
    throw error;
  }
}
