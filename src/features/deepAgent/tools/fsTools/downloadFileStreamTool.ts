import { tool } from "langchain";
import { z } from "zod";

export const downloadFileStreamTool = tool(
  async ({ path }) => {
    return `Binary file download URL: /api/sandbox/fs/download-file-stream?path=${encodeURIComponent(path || "")}`;
  },
  {
    name: "download_file_stream",
    description: `Generate a direct browser download link for binary files (images like PNG/SVG, PDFs, ZIP archives, build artifacts) in the sandbox workspace.

WHEN TO USE:
- Use when the user asks to download, export, or retrieve a binary file (PNG image, SVG logo, PDF invoice, ZIP bundle) from the sandbox.
- Present the returned URL link to the user so they can click and save the file directly to their computer.

WHEN NOT TO USE:
- Do NOT use to read source code or text files into model context (use read_file_text or read_files_text instead).

EXAMPLES & SCENARIOS:
Scenario 1: Providing a download link for a PNG image generated in the sandbox.
  Call: download_file_stream({ path: "src/dashboard.png" })
Scenario 2: Providing a download link for a built ZIP archive.
  Call: download_file_stream({ path: "dist.zip" })`,
    schema: z.object({
      path: z.string().describe("File path of the binary file relative to app root (e.g. 'src/logo.png', 'dist.zip')."),
    }),
  },
);
