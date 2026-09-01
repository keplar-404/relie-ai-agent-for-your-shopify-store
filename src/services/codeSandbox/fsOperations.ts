import path from "node:path";
import { getActiveSandbox } from "./sandboxStore";

const APP_DIR = "/home/daytona/app";

function p(subpath = ""): string {
  const clean = subpath.replace(/^\/+/, "");
  return clean ? path.posix.join(APP_DIR, clean) : APP_DIR;
}

async function exec(action: (fs: any) => Promise<any>): Promise<string> {
  try {
    const sandbox = await getActiveSandbox();
    if (!sandbox) {
      throw new Error("No active sandbox set. Sandbox has not been provisioned yet.");
    }
    const result = await action(sandbox.fs);
    return typeof result === "string" ? result : JSON.stringify(result ?? { success: true });
  } catch (err) {
    return JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Lists files and directories in the sandbox filesystem up to a given depth. */
export async function listFs(targetPath = "", depth = 1): Promise<string> {
  return exec(async (fs) => {
    const list = await fs.listFiles(p(targetPath), { depth });
    return Array.isArray(list) ? list.map((item: any) => item.name ?? item) : list;
  });
}

/** Gets details and metadata for a specific file or directory. */
export async function getFileDetails(targetPath = ""): Promise<string> {
  return exec((fs) => fs.getFileDetails(p(targetPath)));
}

/** Creates a directory in the sandbox app workspace with permission mode. */
export async function createFolder(targetPath = "", mode = "755"): Promise<string> {
  return exec((fs) => fs.createFolder(p(targetPath), mode));
}

/** Uploads a single file (Buffer or string) to the sandbox app workspace. */
export async function uploadFile(
  content: Buffer | string,
  targetPath = "",
): Promise<string> {
  const buf = typeof content === "string" ? Buffer.from(content) : content;
  return exec((fs) => fs.uploadFile(buf, p(targetPath)));
}

/** Uploads multiple files to the sandbox app workspace. */
export async function uploadFiles(
  files: Array<{ source: Buffer | string; destination: string }>,
): Promise<string> {
  const targetFiles = files.map((file) => ({
    ...file,
    destination: p(file.destination),
  }));
  return exec((fs) => fs.uploadFiles(targetFiles));
}

/** Uploads a file stream to the sandbox app workspace. */
export async function uploadFileStream(
  source: any,
  targetPath = "",
): Promise<string> {
  return exec((fs) => fs.uploadFileStream(source, p(targetPath)));
}

/** Downloads a file from the sandbox app workspace as string content. */
export async function downloadFile(targetPath = ""): Promise<string> {
  return exec((fs) => fs.downloadFile(p(targetPath)));
}

/** Downloads multiple files from the sandbox app workspace. */
export async function downloadFiles(
  files: Array<{ source: string; destination?: string }>,
): Promise<string> {
  const targetFiles = files.map((file) => ({
    ...file,
    source: p(file.source),
  }));
  return exec((fs) => fs.downloadFiles(targetFiles));
}

/** Deletes a file or directory inside the sandbox app workspace. */
export async function deleteFile(targetPath = "", recursive = false): Promise<string> {
  return exec((fs) => fs.deleteFile(p(targetPath), recursive));
}

export interface FilePermissions {
  mode?: string;
  owner?: string;
  group?: string;
}

/** Sets file permission mode, owner, and group inside the sandbox app workspace. */
export async function setFilePermissions(
  targetPath = "",
  perms: FilePermissions = {},
): Promise<string> {
  return exec((fs) => fs.setFilePermissions(p(targetPath), perms));
}

/** Searches for files matching a glob pattern inside the sandbox app workspace. */
export async function searchFiles(pattern = "*", targetPath = ""): Promise<string> {
  return exec((fs) => fs.searchFiles(p(targetPath), pattern));
}

/** Finds files containing a specific pattern inside the sandbox app workspace. */
export async function findFiles(pattern = "", targetPath = ""): Promise<string> {
  return exec((fs) => fs.findFiles(p(targetPath), pattern));
}

/** Performs find-and-replace across multiple files inside the sandbox app workspace. */
export async function replaceInFiles(
  files: string[],
  pattern: string,
  newValue: string,
): Promise<string> {
  const targetFiles = files.map((f) => p(f));
  return exec((fs) => fs.replaceInFiles(targetFiles, pattern, newValue));
}

/** Moves or renames files/directories inside the sandbox app workspace. */
export async function moveFiles(
  source: string,
  destination: string,
): Promise<string> {
  return exec((fs) => fs.moveFiles(p(source), p(destination)));
}
