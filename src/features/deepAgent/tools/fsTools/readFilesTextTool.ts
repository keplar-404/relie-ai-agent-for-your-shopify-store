import { tool } from "langchain";
import { z } from "zod";
import { readFilesText } from "@/services/codeSandbox/fsOperations";

export const readFilesTextTool = tool(
  async ({ files }) => readFilesText(files),
  {
    name: "read_files_text",
    description: `Tool Name: read_files_text
What it does: Reads UTF-8 text content from multiple files simultaneously in a single batch request (defaults to lines 1-200 per file).
When to use: Use when inspecting multiple related files together (e.g. package.json and App.tsx, or component + styles) in a single model turn.
Input Format: JSON object { files: Array<{ source: string, startLine?: number, endLine?: number }> } relative to app root.
Output Format:
  - On Success: Formatted string per file: "=== File: <path> (Lines X-Y of Z) ===\n<content>\n\n=== File: <path2> ... ==="
  - On Error / Not Found (per file): In-band error string per failed file: "=== Error reading <path> ===\n<error message>"
Rules / Constraints:
  - Do NOT use for reading a single file (use 'read_file_text').
  - Do NOT use for binary files (images, PDFs, ZIPs).`,
    schema: z.object({
      files: z.array(
        z.object({
          source: z.string().describe("Target file path relative to app root (e.g. 'src/App.tsx')."),
          startLine: z.number().optional().default(1).describe("1-indexed starting line number (default: 1)."),
          endLine: z.number().optional().default(200).describe("1-indexed ending line number (default: 200)."),
        }),
      ).describe("List of files to read in batch."),
    }),
  },
);
