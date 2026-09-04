import { tool } from "langchain";
import { z } from "zod";
import { listFs } from "@/services/codeSandbox/fsOperations";

export const listFsTool = tool(
  async ({ path }) => listFs(path),
  {
    name: "list_fs",
    description: `Tool Name: list_fs
What it does: Lists top-level file and subdirectory names inside a specified directory in the sandbox workspace (/home/daytona/app).
When to use: Use to explore directory contents and verify project structure before creating or editing files.
Input Format: JSON object { path?: string } where path is relative to app root (e.g. '' for root, 'src', 'src/components').
Output Format:
  - On Success: Newline and space separated string of file/folder names (e.g. "src\n public\n package.json")
  - On Error / Not Found: Throws an Error exception ("lstat /home/daytona/app/<path>: no such file or directory").
Rules / Constraints:
  - Do NOT use to read file text content (use 'read_file_text').
  - Do NOT use to search by file pattern or text (use 'search_files' or 'find_files').`,
    schema: z.object({
      path: z
        .string()
        .optional()
        .describe("Directory path relative to app root (e.g. '' for root, 'src', 'src/components'). Defaults to root."),
    }),
  },
);
