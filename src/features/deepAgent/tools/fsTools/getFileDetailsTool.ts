import { tool } from "langchain";
import { z } from "zod";
import { getFileDetails } from "@/services/codeSandbox/fsOperations";

export const getFileDetailsTool = tool(
  async ({ path }) => getFileDetails(path),
  {
    name: "get_file_details",
    description: `Retrieve metadata details for a file or directory inside the sandbox app workspace, including file size in bytes, last modified time, and timestamp.

WHEN TO USE:
- Use to check if a specific file exists.
- Use to inspect file size before downloading or editing.
- Use to check when a file was last modified.

EXAMPLES & SCENARIOS:
Scenario 1: Checking metadata for package.json.
  Call: get_file_details({ path: "package.json" })
Scenario 2: Inspecting file size and modification time for a source file.
  Call: get_file_details({ path: "src/App.tsx" })`,
    schema: z.object({
      path: z
        .string()
        .optional()
        .describe("Target file or folder path relative to app root (e.g. 'package.json', 'src/App.tsx')."),
    }),
  },
);
