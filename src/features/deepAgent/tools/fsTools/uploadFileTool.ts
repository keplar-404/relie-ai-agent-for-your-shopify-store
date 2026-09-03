import { tool } from "langchain";
import { z } from "zod";
import { uploadFile } from "@/services/codeSandbox/fsOperations";

export const uploadFileTool = tool(
  async ({ content, path }) => uploadFile(content, path),
  {
    name: "upload_file",
    description: `Write or update a single UTF-8 text file (source code like .tsx/.ts, JSON, Markdown, CSS, HTML, .env) in the sandbox app workspace.

WHEN TO USE:
- Use EXCLUSIVELY for writing or replacing text and code files (.tsx, .ts, .json, .css, .md, .html, .env).
- Use when creating a new React component, styling file, or writing source code.

WHEN NOT TO USE:
- Do NOT use for binary uploads like PNG/JPG/ZIP files (use upload_file_stream for binary data).

EXAMPLES & SCENARIOS:
Scenario 1: Writing a new React component file.
  Call: upload_file({ path: "src/components/Header.tsx", content: "export function Header() { return <header>Header</header>; }" })
Scenario 2: Updating package.json configuration file.
  Call: upload_file({ path: "package.json", content: "{\n  \"name\": \"app\"\n}" })`,
    schema: z.object({
      content: z.string().describe("Complete UTF-8 text content to write into the file."),
      path: z.string().optional().describe("Target text file path relative to app root (e.g. 'src/Header.tsx')."),
    }),
  },
);
