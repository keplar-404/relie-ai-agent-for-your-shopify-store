import { tool } from "langchain";
import { z } from "zod";
import { readFileText } from "@/services/codeSandbox/fsOperations";

export const readFileTextTool = tool(
  async ({ path, startLine = 1, endLine = 200 }) =>
    readFileText(path, startLine, endLine),
  {
    name: "read_file_text",
    description: `Read UTF-8 text content of a file from the sandbox workspace line-by-line (defaults to lines 1 to 200).

WHEN TO USE:
- Use to read source code, configuration files, or logs.
- Use startLine and endLine parameters to slice large files and inspect specific sections of code.

EXAMPLES & SCENARIOS:
Scenario 1: Reading the default top 200 lines of package.json.
  Call: read_file_text({ path: "package.json" })
Scenario 2: Reading lines 50 through 150 of a large component file.
  Call: read_file_text({ path: "src/App.tsx", startLine: 50, endLine: 150 })`,
    schema: z.object({
      path: z.string().optional().describe("Target file path relative to app root (e.g. 'src/App.tsx')."),
      startLine: z.number().optional().default(1).describe("1-indexed starting line number (default: 1)."),
      endLine: z.number().optional().default(200).describe("1-indexed ending line number (default: 200)."),
    }),
  },
);
