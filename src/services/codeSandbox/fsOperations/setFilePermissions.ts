import type { FilePermissionsParams } from "@daytona/sdk";
import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Sets file permissions (mode e.g. '755' for executable scripts, owner, group) for a path in the sandbox workspace. */
export async function setFilePermissions(
  path?: string,
  perms: FilePermissionsParams = {},
) {
  try {
    const sandbox = await getActiveSandbox();
    const resolvedPath = resolvePath(path);
    await sandbox.fs.setFilePermissions(resolvedPath, perms);
    return `Permissions updated successfully for ${resolvedPath}`;
  } catch (error) {
    console.error("[fsOperations: setFilePermissions] Error:", error);
    throw error;
  }
}
