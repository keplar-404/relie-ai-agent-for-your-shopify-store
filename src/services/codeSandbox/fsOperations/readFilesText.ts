import type { FileDownloadRequest } from "@daytona/sdk";
import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Reads UTF-8 text content from multiple files simultaneously in the sandbox workspace (defaults to lines 1-200 per file). */
export async function readFilesText(
  files: Array<{ source: string; startLine?: number; endLine?: number }>,
) {
  try {
    const sandbox = await getActiveSandbox();
    const requests: FileDownloadRequest[] = files.map((f) => ({
      source: resolvePath(f.source),
    }));
    const results = await sandbox.fs.downloadFiles(requests);

    return results
      .map((res, index) => {
        if (res.error) {
          return `=== Error reading ${res.source} ===\n${res.error}`;
        }
        const text = Buffer.isBuffer(res.result)
          ? res.result.toString("utf-8")
          : String(res.result ?? "");

        const lines = text.split(/\r?\n/);
        const req = files[index];
        const sLine = req?.startLine ? Number(req.startLine) : 1;
        const eLine = req?.endLine ? Number(req.endLine) : 200;
        const slicedLines = lines.slice(sLine - 1, eLine);

        return `=== File: ${res.source} (Lines ${sLine}-${Math.min(eLine, lines.length)} of ${lines.length}) ===\n${slicedLines.join("\n")}`;
      })
      .join("\n\n");
  } catch (error) {
    console.error("[fsOperations: readFilesText] Error:", error);
    throw error;
  }
}

/** Alias for readFilesText. */
export const downloadFiles = readFilesText;
