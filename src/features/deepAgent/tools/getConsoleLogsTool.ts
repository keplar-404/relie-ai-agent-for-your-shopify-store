import { tool } from "langchain";
import { z } from "zod";
import { getConsoleLogs } from "@/services/codeSandbox/fsOperations";
import { getActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export const getConsoleLogsTool = tool(
  async ({ sandboxId: requestedSandboxId }: { sandboxId?: string }) => {
    try {
      const sandboxId = requestedSandboxId || getActiveSandboxId();
      if (!sandboxId) {
        return "Error: No active sandbox ID found. Ensure a sandbox is running.";
      }

      // Execute getConsoleLogs via fsOperations service
      const logs = await getConsoleLogs(sandboxId);
      const stdout = logs.stdout || "";
      const stderr = logs.stderr || "";

      if (!stdout && !stderr) {
        return "Console logs: [No stdout or stderr output produced yet].";
      }

      return [
        "=== SANDBOX CONSOLE STDOUT ===",
        stdout ? stdout.slice(-2000) : "[Empty]",
        "\n=== SANDBOX CONSOLE STDERR ===",
        stderr ? stderr.slice(-2000) : "[Empty]",
      ].join("\n");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error retrieving console logs: ${message}`;
    }
  },
  {
    name: "get_console_logs",
    description: `Tool Name: get_console_logs
What it does: Retrieves recent console output (stdout and stderr) from the active Daytona sandbox server/entrypoint process.
When to use: Use after writing or modifying code to check if runtime errors, unhandled rejections, or server crashes occurred in the sandbox console.
Input Format: JSON object { sandboxId?: string }.
Output Format:
  - On Success: Text string with formatted stdout and stderr log sections (truncated to last 2000 characters).
  - On Error: "Error: <reason>".`,
    schema: z.object({
      sandboxId: z.string().optional().describe("Optional Daytona sandbox ID override."),
    }),
  },
);
