import { tool } from "langchain";
import { z } from "zod";
import { readFilesText } from "@/services/codeSandbox/fsOperations";

export const readFilesTextTool = tool(
  async ({ files }) => readFilesText(files),
  {
    name: "read_files_text",
    description: `Read text content from multiple files simultaneously in 1 batch request (defaults to lines 1-200 per file).

WHEN TO USE:
- Use when you need to inspect several related files together at the same time (e.g. App.tsx, package.json, and main.tsx).
- Saves model turns by fetching context for multiple files in a single call.

EXAMPLES & SCENARIOS:
Scenario 1: Reading package.json and App.tsx at the same time.
  Call: read_files_text({
    files: [
      { source: "package.json", startLine: 1, endLine: 50 },
      { source: "src/App.tsx", startLine: 1, endLine: 100 }
    ]
  })`,
    schema: z.object({
      files: z.array(
        z.object({
          source: z.string().describe("Target file path relative to app root (e.g. 'src/App.tsx')."),
          startLine: z.number().optional().default(1).describe("1-indexed starting line number (default: 1)."),
          endLine: z.number().optional().default(200).describe("1-indexed ending line number (default: 200)."),
        }),
      ).describe("List of files to read in batch."),
    }),
  },
);
