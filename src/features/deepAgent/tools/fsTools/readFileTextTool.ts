import { tool } from "langchain";
import { z } from "zod";
import { readFileText } from "@/services/codeSandbox/fsOperations";

export const readFileTextTool = tool(
  async ({ path, startLine = 1, endLine }) =>
    readFileText(path, startLine, endLine),
  {
    name: "read_file_text",
    description: `Tool Name: read_file_text
What it does: Reads UTF-8 text content of a single file from the sandbox workspace (/home/daytona/app) within line ranges (defaults to lines 1-200).
When to use: Use when inspecting source code, configuration files, or logs to understand existing logic before editing.
Input Format: JSON object { path?: string, startLine?: number, endLine?: number } relative to app root.
Output Format:
  - On Success: String containing sliced line contents from startLine to endLine.
  - On Error / Not Found: Throws Error exception ("open /home/daytona/app/<path>: no such file or directory").
Rules / Constraints:
  - Do NOT use for binary files (images, PDFs, ZIPs).
  - Do NOT use to read multiple files simultaneously (use 'read_files_text' to save turns).
  - Do NOT use to list directory contents (use 'list_fs').`,
    schema: z.object({
      path: z.string().optional().describe("Target file path relative to app root (e.g. 'src/App.tsx')."),
      startLine: z.number().optional().default(1).describe("1-indexed starting line number (default: 1)."),
      endLine: z.number().optional().describe("1-indexed ending line number (defaults to startLine + 200)."),
    }),
  },
);
