// All functions take a `sandboxId` and resolve the sandbox via the shared client.
import { Readable } from "node:stream";
import sandBox from "./index";

// ---------- List files and directories ----------
export async function listFs(
  sandboxId: string,
  path = "/home/sandBox/app",
  depth = 5,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.listFiles(path, { depth });
}

// ---------- Get directory or file information ----------
export async function getFileDetails(sandboxId: string, path: string) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.getFileDetails(path);
}

// ---------- Create directories ----------
export async function createFolder(
  sandboxId: string,
  path: string,
  mode = "755",
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.createFolder(path, mode);
}

// ---------- Upload files ----------
export async function uploadFile(
  sandboxId: string,
  content: Buffer | string,
  destPath: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.uploadFile(
    typeof content === "string" ? Buffer.from(content) : content,
    destPath,
  );
}

export async function uploadFiles(
  sandboxId: string,
  files: Array<{ source: Buffer | string; destination: string }>,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.uploadFiles(
    files.map((f) => ({
      source: typeof f.source === "string" ? Buffer.from(f.source) : f.source,
      destination: f.destination,
    })),
  );
}

export async function uploadFileStream(
  sandboxId: string,
  source: Readable,
  destPath: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.uploadFileStream(source, destPath);
}

// ---------- Download files ----------
export async function downloadFile(sandboxId: string, path: string) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.downloadFile(path);
}

export async function downloadFiles(
  sandboxId: string,
  files: Array<{ source: string; destination?: string }>,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.downloadFiles(files);
}

export async function downloadFileStream(sandboxId: string, path: string) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.downloadFileStream(path);
}

// ---------- Delete files ----------
export async function deleteFile(
  sandboxId: string,
  path: string,
  recursive = false,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.deleteFile(path, recursive);
}

// ---------- File permissions ----------
export interface FilePermissions {
  mode?: string;
  owner?: string;
  group?: string;
}

export async function setFilePermissions(
  sandboxId: string,
  path: string,
  perms: FilePermissions,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.setFilePermissions(path, perms);
}

// ---------- Search files by pattern (glob) ----------
export async function searchFiles(
  sandboxId: string,
  path: string,
  pattern: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.searchFiles(path, pattern);
}

// ---------- Find and replace ----------
export async function findFiles(
  sandboxId: string,
  path: string,
  pattern: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.findFiles(path, pattern);
}

export async function replaceInFiles(
  sandboxId: string,
  files: string[],
  pattern: string,
  newValue: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.replaceInFiles(files, pattern, newValue);
}

// ---------- Move or rename ----------
export async function moveFiles(
  sandboxId: string,
  source: string,
  destination: string,
) {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.fs.moveFiles(source, destination);
}
