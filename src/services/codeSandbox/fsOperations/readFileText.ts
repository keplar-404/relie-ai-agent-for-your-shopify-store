import { getActiveSandbox } from "../sandboxStore";
import { resolvePath } from "./resolvePath";

/** Reads UTF-8 text content from a source code or text file in line ranges (defaults to lines 1-200). Deep Agent friendly. */
export async function readFileText(
  path?: string,
  startLine = 1,
  endLine = 200,
) {
  try {
    const sLine = Number(startLine);
    const eLine = Number(endLine);

    if (isNaN(sLine) || isNaN(eLine) || sLine < 1 || eLine < sLine) {
      throw new Error(
        `Invalid line range: startLine (${startLine}) must be >= 1 and endLine (${endLine}) must be >= startLine.`,
      );
    }

    const sandbox = await getActiveSandbox();
    const buffer = await sandbox.fs.downloadFile(resolvePath(path));
    const text = buffer.toString("utf-8");
    const lines = text.split(/\r?\n/);

    const slicedLines = lines.slice(sLine - 1, eLine);
    return slicedLines.join("\n");
  } catch (error) {
    console.error("[fsOperations: readFileText] Error:", error);
    throw error;
  }
}

/** Alias for readFileText. */
export const downloadFile = readFileText;
