import { tool } from "langchain";
import { z } from "zod";
import { findFiles } from "@/services/codeSandbox/fsOperations";

export const findFilesTool = tool(
  async ({ pattern, path }) => findFiles(pattern, path),
  {
    name: "find_files",
    description: `Search for text or code patterns inside file contents across the sandbox workspace and return file paths, line numbers, and matching content lines.

WHEN TO USE:
- Use to locate where a specific function, class, variable, import, or CSS class is referenced.
- Use to find code snippets across multiple files.

EXAMPLES & SCENARIOS:
Scenario 1: Finding where 'createRoot' is imported or called in src.
  Call: find_files({ pattern: "createRoot", path: "src" })
Scenario 2: Finding occurrences of a specific dependency in project files.
  Call: find_files({ pattern: "react-router-dom" })`,
    schema: z.object({
      pattern: z.string().describe("Exact text pattern to search for inside file contents."),
      path: z.string().optional().describe("Base directory path relative to app root (e.g. 'src')."),
    }),
  },
);
