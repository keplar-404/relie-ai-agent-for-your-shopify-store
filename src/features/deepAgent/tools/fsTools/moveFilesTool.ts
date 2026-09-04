import { tool } from "langchain";
import { z } from "zod";
import { moveFiles } from "@/services/codeSandbox/fsOperations";

export const moveFilesTool = tool(
  async ({ source, destination }) => moveFiles(source, destination),
  {
    name: "move_files",
    description: `Tool Name: move_files
What it does: Moves or renames a file or directory in the sandbox workspace (/home/daytona/app).
When to use: Use when renaming a file or directory, or moving a file into a new directory structure.
Input Format: JSON object { source: string, destination: string } relative to app root.
Output Format:
  - On Success: String "Files moved successfully from /home/daytona/app/<source> to /home/daytona/app/<destination>"
  - On Error / Not Found: Throws DaytonaFileNotFoundError ("stat /home/daytona/app/<source>: no such file or directory").
Rules / Constraints:
  - Do NOT use to update file content (use 'upload_file' or 'replace_in_files').
  - Do NOT use to delete a file (use 'delete_file').`,
    schema: z.object({
      source: z.string().describe("Source file or folder path relative to app root."),
      destination: z.string().describe("Destination file or folder path relative to app root."),
    }),
  },
);
