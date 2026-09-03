import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Lists top-level files and subdirectories at a path in the sandbox workspace. */
export async function listFs(path?: string) {
  try {
    const sandbox = await getActiveSandbox();
    const fileList = await sandbox.fs.listFiles(resolvePath(path), { depth: 1 });
    return fileList.map((file) => `${file.name}`).join("\n ");
  } catch (error) {
    console.error("[fsOperations: listFs] Error:", error);
    throw error;
  }
}
