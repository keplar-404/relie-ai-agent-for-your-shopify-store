import { tool } from "langchain";
import { z } from "zod";
import { listFs } from "@/services/codeSandbox/fsOperations";

export const listFsTool = tool(
  async ({ path }) => listFs(path),
  {
    name: "list_fs",
    description: `List top-level files and subdirectories at a specific directory path inside the sandbox app workspace (/home/daytona/app).

WHEN TO USE:
- Use to explore the directory structure before reading or modifying code.
- Use to verify if files or folders exist in a directory.

WHEN NOT TO USE:
- Do NOT use if you need to search for files matching a glob pattern (use search_files instead).
- Do NOT use if you need to find text content inside files (use find_files instead).

EXAMPLES & SCENARIOS:
Scenario 1: Inspecting files at the workspace root directory.
  Call: list_fs({ path: "" })
Scenario 2: Inspecting files inside the src directory.
  Call: list_fs({ path: "src" })
Scenario 3: Inspecting contents of a components folder.
  Call: list_fs({ path: "src/components" })`,
    schema: z.object({
      path: z
        .string()
        .optional()
        .describe("Directory path relative to app root (e.g. '' for root, or 'src', 'src/components'). Defaults to root."),
    }),
  },
);
