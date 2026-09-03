import { tool } from "langchain";
import { z } from "zod";
import { searchFiles } from "@/services/codeSandbox/fsOperations";

export const searchFilesTool = tool(
  async ({ pattern, path }) => searchFiles(pattern, path),
  {
    name: "search_files",
    description: `Search for file paths matching a glob pattern (e.g. '*.ts', 'src/**/*.tsx', '*.json') inside the sandbox workspace.

WHEN TO USE:
- Use to find all files of a certain type or extension across the codebase.
- Use to locate files when you know part of the filename but not its exact path.

EXAMPLES & SCENARIOS:
Scenario 1: Finding all TypeScript files in the src folder.
  Call: search_files({ pattern: "*.tsx", path: "src" })
Scenario 2: Finding all JSON configuration files in the project.
  Call: search_files({ pattern: "*.json" })`,
    schema: z.object({
      pattern: z.string().optional().describe("Glob pattern to match file names (e.g. '*.tsx', '*.json', '*'). Defaults to '*'."),
      path: z.string().optional().describe("Base directory path relative to app root to search within (e.g. 'src')."),
    }),
  },
);
