import { tool } from "langchain";
import { z } from "zod";
import { uploadFiles } from "@/services/codeSandbox/fsOperations";

export const uploadFilesTool = tool(
  async ({ files }) => uploadFiles(files),
  {
    name: "upload_files",
    description: `Write or update multiple UTF-8 text files simultaneously in a single batch step inside the sandbox app workspace.

WHEN TO USE:
- Use EXCLUSIVELY for batch writing text/code files (.tsx, .ts, .json, .css, .md, .html).
- Use when creating a new component module requiring both a code file and a stylesheet at once.

EXAMPLES & SCENARIOS:
Scenario 1: Creating a component file and its CSS stylesheet in one batch step.
  Call: upload_files({
    files: [
      { destination: "src/Button.tsx", source: "export function Button() { return <button>Click</button>; }" },
      { destination: "src/Button.css", source: "button { color: blue; }" }
    ]
  })`,
    schema: z.object({
      files: z.array(
        z.object({
          source: z.string().describe("UTF-8 text content of the file to write."),
          destination: z.string().describe("Target file path relative to app root (e.g. 'src/Button.tsx')."),
        }),
      ).describe("List of text files to write in batch."),
    }),
  },
);
