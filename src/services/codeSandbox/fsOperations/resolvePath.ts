import path from "node:path";

const APP_DIR = "/home/daytona/app";

/** Resolves a relative path against the default sandbox application workspace root directory (/home/daytona/app). */
export function resolvePath(targetPath?: string): string {
  if (!targetPath || targetPath.trim() === "" || targetPath.trim() === ".") return APP_DIR;
  const trimmed = targetPath.trim();
  if (trimmed.startsWith("/")) {
    return path.posix.normalize(trimmed);
  }
  return path.posix.normalize(`${APP_DIR}/${trimmed}`);
}
