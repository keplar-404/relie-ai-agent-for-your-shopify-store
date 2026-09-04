import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Deletes a file or directory (recursively if specified) from the sandbox workspace. Enforces safety guards and handles edge cases. */
export async function deleteFile(path?: string, recursive = false) {
  try {
    const sandbox = await getActiveSandbox();
    const resolvedPath = resolvePath(path);

    // Safety Guard 1: Protect workspace root directory
    if (resolvedPath === "/home/daytona/app" || resolvedPath === "/home/daytona/app/" || resolvedPath === "/") {
      return "Error: Deleting the workspace root directory is forbidden for project safety.";
    }

    // Safety Guard 2: Protect core project configuration files
    const normalized = resolvedPath.replace(/\/+$/, "");
    if (normalized.endsWith("/package.json") || normalized.endsWith("/package-lock.json") || normalized.endsWith("/bun.lockb")) {
      return `Error: Deleting core project configuration file (${path}) is forbidden to prevent project breakdown.`;
    }

    try {
      await sandbox.fs.deleteFile(resolvedPath, recursive);
      return `File deleted successfully from ${resolvedPath}`;
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("cannot delete directory without recursive flag")) {
        // Auto-retry with recursive = true for directories
        await sandbox.fs.deleteFile(resolvedPath, true);
        return `Directory deleted recursively from ${resolvedPath}`;
      }
      if (msg.includes("no such file or directory")) {
        return `File or directory already removed or does not exist at ${resolvedPath}`;
      }
      throw err;
    }
  } catch (error) {
    console.error("[fsOperations: deleteFile] Error:", error);
    throw error;
  }
}
