import { tool } from "langchain";
import { z } from "zod";
import { deleteFile } from "@/services/codeSandbox/fsOperations";

export const deleteFileTool = tool(
  async ({ path, recursive }) => deleteFile(path, recursive),
  {
    name: "delete_file",
    description: `Delete a file or directory inside the sandbox app workspace.

WHEN TO USE:
- Use to remove unused code files, temporary test files, or build artifacts.
- Set recursive=true ONLY when deleting non-empty directories.

EXAMPLES & SCENARIOS:
Scenario 1: Deleting a single file.
  Call: delete_file({ path: "src/temp-file.txt" })
Scenario 2: Deleting a build directory recursively.
  Call: delete_file({ path: "dist", recursive: true })`,
    schema: z.object({
      path: z.string().optional().describe("File or directory path relative to app root (e.g. 'src/old.ts')."),
      recursive: z.boolean().optional().describe("Set true to delete non-empty directories recursively."),
    }),
  },
);
