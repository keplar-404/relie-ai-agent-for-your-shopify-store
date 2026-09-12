import { tool } from "langchain";
import { z } from "zod";
import { runTypecheck } from "@/services/codeSandbox/fsOperations";
import { getActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export const runTypecheckTool = tool(
  async ({ cwd = ".", sandboxId: requestedSandboxId }: { cwd?: string; sandboxId?: string }) => {
    try {
      const sandboxId = requestedSandboxId || getActiveSandboxId();
      if (!sandboxId) {
        return "Error: No active sandbox ID found. Ensure a sandbox is running.";
      }

      // Execute TypeScript typecheck via fsOperations service
      const res = await runTypecheck(sandboxId, cwd);

      if (res.exitCode === 0) {
        return "✅ TypeScript typecheck passed cleanly with 0 errors.";
      }

      const output = res.result || "";
      return [
        `❌ TypeScript typecheck failed (exit code ${res.exitCode}):`,
        output ? output.slice(-3000) : "[No error output recorded]",
      ].join("\n");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error running typecheck: ${message}`;
    }
  },
  {
    name: "run_typecheck",
    description: `Tool Name: run_typecheck
What it does: Runs TypeScript type checking ('npx tsc --noEmit') inside the Daytona sandbox workspace.
When to use: Use after editing or generating TypeScript code to validate syntax, types, missing imports, or prop interface errors.
Input Format: JSON object { cwd?: string, sandboxId?: string }.
Output Format:
  - On Success: "✅ TypeScript typecheck passed cleanly with 0 errors."
  - On Type Errors: "❌ TypeScript typecheck failed..." with error details and line numbers.`,
    schema: z.object({
      cwd: z.string().optional().default(".").describe("Working directory relative to workspace root (default: '.')."),
      sandboxId: z.string().optional().describe("Optional Daytona sandbox ID override."),
    }),
  },
);
