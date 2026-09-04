import { tool } from "langchain";
import { z } from "zod";
import { findFiles } from "@/services/codeSandbox/fsOperations";

export const findFilesTool = tool(
  async ({ pattern, path }) => findFiles(pattern, path),
  {
    name: "find_files",
    description: `Tool Name: find_files
What it does: Searches for exact text or code patterns INSIDE file contents across the sandbox workspace and returns match locations (file path, line number, line content).
When to use: Use when finding where a specific function, class, component, variable, or text string is used across project files.
Input Format: JSON object { pattern: string, path?: string } where pattern is the text to find and path is the search root directory (e.g. 'src').
Output Format:
  - On Success: Array of MatchResult objects [{ file: string, line: number, content: string }] containing match locations.
  - On Error / Not Found: Returns an empty array [] if pattern is not found.
Rules / Constraints:
  - Do NOT use if you only want to list file paths by extension (use 'search_files').
  - Do NOT use to read full file contents (use 'read_file_text').`,
    schema: z.object({
      pattern: z.string().describe("Exact text or code pattern to search for inside file contents."),
      path: z.string().optional().describe("Base directory relative to app root (e.g. 'src')."),
    }),
  },
);
