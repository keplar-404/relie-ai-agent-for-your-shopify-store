import { tool } from "langchain";
import { z } from "zod";
import { replaceInFiles } from "@/services/codeSandbox/fsOperations";

export const replaceInFilesTool = tool(
  async ({ files, pattern, newValue }) => replaceInFiles(files, pattern, newValue),
  {
    name: "replace_in_files",
    description: `Perform exact text search-and-replace across multiple specified files in the sandbox workspace.

WHEN TO USE:
- Use when refactoring or renaming a component, variable, or import across multiple files simultaneously.

EXAMPLES & SCENARIOS:
Scenario 1: Renaming a component import across App.tsx and main.tsx.
  Call: replace_in_files({
    files: ["src/App.tsx", "src/main.tsx"],
    pattern: "OldHeader",
    newValue: "NewHeader"
  })`,
    schema: z.object({
      files: z.array(z.string()).describe("List of target file paths relative to app root."),
      pattern: z.string().describe("Exact text pattern to replace."),
      newValue: z.string().describe("Replacement text."),
    }),
  },
);
