import { Readable } from "node:stream";
import sandBox from "./index";

/** Lists files and directories in the sandbox filesystem up to a given depth. */
export async function listFs(
  sandboxId: string,
  path = "/home/sandBox/app",
  depth = 5,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.listFiles(path, { depth });
}

/** Gets details and metadata for a specific file or directory. */
export async function getFileDetails(sandboxId: string, path: string) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.getFileDetails(path);
}

/** Creates a directory at the specified path with permission mode. */
export async function createFolder(
  sandboxId: string,
  path: string,
  mode = "755",
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.createFolder(path, mode);
}

/** Uploads a single file (Buffer or string) to the sandbox. */
export async function uploadFile(
  sandboxId: string,
  content: Buffer | string,
  destPath: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.uploadFile(content, destPath);
}

/** Uploads multiple files to the sandbox. */
export async function uploadFiles(
  sandboxId: string,
  files: Array<{ source: Buffer | string; destination: string }>,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.uploadFiles(files);
}

/** Uploads a file stream to the sandbox destination. */
export async function uploadFileStream(
  sandboxId: string,
  source: Readable,
  destPath: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.uploadFileStream(source, destPath);
}

/** Downloads a file from the sandbox as Buffer content. */
export async function downloadFile(sandboxId: string, path: string) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.downloadFile(path);
}

/** Downloads multiple files from the sandbox. */
export async function downloadFiles(
  sandboxId: string,
  files: Array<{ source: string; destination?: string }>,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.downloadFiles(files);
}

/** Downloads a file from the sandbox as a readable stream. */
export async function downloadFileStream(sandboxId: string, path: string) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.downloadFileStream(path);
}

/** Deletes a file or directory in the sandbox. */
export async function deleteFile(
  sandboxId: string,
  path: string,
  recursive = false,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.deleteFile(path, recursive);
}

export interface FilePermissions {
  mode?: string;
  owner?: string;
  group?: string;
}

/** Sets file permission mode, owner, and group in the sandbox. */
export async function setFilePermissions(
  sandboxId: string,
  path: string,
  perms: FilePermissions,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.setFilePermissions(path, perms);
}

/** Searches for files matching a glob pattern in the sandbox path. */
export async function searchFiles(
  sandboxId: string,
  path: string,
  pattern: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.searchFiles(path, pattern);
}

/** Finds files containing a specific pattern in the sandbox. */
export async function findFiles(
  sandboxId: string,
  path: string,
  pattern: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.findFiles(path, pattern);
}

/** Performs find-and-replace across multiple files in the sandbox. */
export async function replaceInFiles(
  sandboxId: string,
  files: string[],
  pattern: string,
  newValue: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.replaceInFiles(files, pattern, newValue);
}

/** Moves or renames files/directories in the sandbox. */
export async function moveFiles(
  sandboxId: string,
  source: string,
  destination: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.moveFiles(source, destination);
}
