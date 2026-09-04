import { tool } from "langchain";
import { z } from "zod";

export const downloadFileStreamTool = tool(
  async ({ path }) => {
    return `Binary file download URL: /api/sandbox/fs/download-file-stream?path=${encodeURIComponent(path || "")}`;
  },
  {
    name: "download_file_stream",
    description: `Tool Name: download_file_stream
What it does: Generates a direct 1-click browser download URL link for binary files (images, PDFs, ZIP archives, build artifacts) in the sandbox workspace.
When to use: Use when the user requests to download, export, or retrieve a binary file or archive from the sandbox to their local computer.
Input Format: JSON object { path: string } where path is relative to app root (e.g. 'public/logo.png').
Output Format:
  - On Success: String "Binary file download URL: /api/sandbox/fs/download-file-stream?path=<encodedPath>"
  - On Error / Not Found: Returns the URL link string (browser request to URL handles 404 if file does not exist).
Rules / Constraints:
  - Do NOT use to read text or source code files into model context (use 'read_file_text').
  - Format the returned URL as a markdown link for the user.`,
    schema: z.object({
      path: z.string().describe("File path of the binary file relative to app root (e.g. 'src/assets/logo.png', 'dist.zip')."),
    }),
  },
);
