import { tool } from "langchain";
import { z } from "zod";
import { createFolder } from "@/services/codeSandbox/fsOperations";

export const createFolderTool = tool(
  async ({ path }) => createFolder(path),
  {
    name: "create_folder",
    description: `Create a directory inside the sandbox app workspace with default permission mode ('775').

WHEN TO USE:
- Use when preparing folder structures before creating new component files or modules.

EXAMPLES & SCENARIOS:
Scenario 1: Creating a new components folder inside src.
  Call: create_folder({ path: "src/components" })
Scenario 2: Creating a subfolder for UI elements.
  Call: create_folder({ path: "src/components/ui" })`,
    schema: z.object({
      path: z
        .string()
        .optional()
        .describe("Folder path to create relative to app root (e.g. 'src/components', 'dist/assets')."),
    }),
  },
);
