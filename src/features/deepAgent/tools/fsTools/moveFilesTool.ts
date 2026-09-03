import { tool } from "langchain";
import { z } from "zod";
import { moveFiles } from "@/services/codeSandbox/fsOperations";

export const moveFilesTool = tool(
  async ({ source, destination }) => moveFiles(source, destination),
  {
    name: "move_files",
    description: `Move or rename files and directories inside the sandbox app workspace.

WHEN TO USE:
- Use to rename a file or folder.
- Use to move a component or file into a different subdirectory.

EXAMPLES & SCENARIOS:
Scenario 1: Renaming a file from old-name.ts to new-name.ts.
  Call: move_files({ source: "src/old-name.ts", destination: "src/new-name.ts" })
Scenario 2: Moving a component into a components folder.
  Call: move_files({ source: "src/Header.tsx", destination: "src/components/Header.tsx" })`,
    schema: z.object({
      source: z.string().describe("Source file/folder path relative to app root."),
      destination: z.string().describe("Destination file/folder path relative to app root."),
    }),
  },
);
