import { tool } from "langchain";
import { z } from "zod";
import { createFolder } from "@/services/codeSandbox/fsOperations";

export const createFolderTool = tool(
  async ({ path }) => createFolder(path),
  {
    name: "create_folder",
    description: `Tool Name: create_folder
What it does: Creates a new directory or folder structure inside the sandbox workspace (/home/daytona/app) with permission mode '775'.
When to use: Use when creating new directory paths or nested subdirectories for modular code organization (e.g. 'src/components/ui') before adding files.
Input Format: JSON object { path: string } where path is relative to app root (e.g. 'src/components').
Output Format:
  - On Success: String "Folder created successfully at /home/daytona/app/<path>"
  - On Error / Not Found: Throws an Error exception (e.g. permission or invalid path failure).
Rules / Constraints:
  - Do NOT use to create or write text/code files (use 'upload_file' or 'upload_files' to write code files!).
  - Do NOT call if the directory already exists.`,
    schema: z.object({
      path: z
        .string()
        .optional()
        .describe("Folder path to create relative to app root (e.g. 'src/components', 'src/features/auth')."),
    }),
  },
);
