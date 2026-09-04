import { tool } from "langchain";
import { z } from "zod";
import { uploadFiles } from "@/services/codeSandbox/fsOperations";

export const uploadFilesTool = tool(
  async ({ files }) => uploadFiles(files),
  {
    name: "upload_files",
    description: `Tool Name: upload_files
What it does: Creates or overwrites multiple UTF-8 text/code files simultaneously in a single batch step inside the sandbox workspace (/home/daytona/app).
When to use: Use when creating multi-file component modules (e.g. Component + CSS + Types) or updating multiple files in a single model turn.
Input Format: JSON object { files: Array<{ source: string, destination: string }> } relative to app root.
Output Format:
  - On Success: String "Files uploaded successfully: /home/daytona/app/<dest1>, /home/daytona/app/<dest2>"
  - On Error / Not Found: Throws Error exception if batch upload fails.
Rules / Constraints:
  - ALWAYS provide 100% complete file content per file. No placeholders like "// TODO"!
  - Do NOT use if writing only a single file (use 'upload_file').
  - Do NOT use for binary files (images, PDFs, ZIP archives).`,
    schema: z.object({
      files: z.array(
        z.object({
          source: z.string().describe("100% complete UTF-8 text/code content of the file."),
          destination: z.string().describe("Target file path relative to app root (e.g. 'src/Button.tsx')."),
        }),
      ).describe("List of files to write in batch."),
    }),
  },
);
