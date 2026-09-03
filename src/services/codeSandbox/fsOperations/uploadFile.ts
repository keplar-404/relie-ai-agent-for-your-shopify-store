import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Writes or updates a single UTF-8 text file (source code, JSON, Markdown, CSS, config) in the sandbox workspace. */
export async function uploadFile(content: string | Buffer, path?: string) {
  try {
    const sandbox = await getActiveSandbox();
    const buffer = typeof content === "string" ? Buffer.from(content) : content;
    const resolvedPath = resolvePath(path);
    await sandbox.fs.uploadFile(buffer, resolvedPath);
    return `File uploaded successfully to ${resolvedPath}`;
  } catch (error) {
    console.error("[fsOperations: uploadFile] Error:", error);
    throw error;
  }
}
