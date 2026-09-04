import { tool } from "langchain";
import { z } from "zod";
import { uploadFile } from "@/services/codeSandbox/fsOperations";

export const uploadFileTool = tool(
  async ({ content, path }) => uploadFile(content, path),
  {
    name: "upload_file",
    description: `Tool Name: upload_file
What it does: Creates or overwrites a single UTF-8 text/code file (.tsx, .ts, .json, .css, .md, .html, .env) in the sandbox workspace (/home/daytona/app).
When to use: Use when creating a new source file or completely updating an existing file with complete production-ready code.
Input Format: JSON object { content: string, path?: string } relative to app root.
Output Format:
  - On Success: String "File uploaded successfully to /home/daytona/app/<path>"
  - On Error / Not Found: Throws Error exception if path is invalid or write fails.
Rules / Constraints:
  - ALWAYS provide 100% complete file content. No placeholders like "// TODO" or "// rest of code remains same"!
  - Do NOT use for writing multiple files simultaneously (use 'upload_files' to save turns).
  - Do NOT use for binary files (images, PDFs, ZIP archives).`,
    schema: z.object({
      content: z.string().describe("Complete 100% UTF-8 text/code content to write into the file. No placeholders!"),
      path: z.string().optional().describe("Target file path relative to app root (e.g. 'src/Header.tsx')."),
    }),
  },
);
