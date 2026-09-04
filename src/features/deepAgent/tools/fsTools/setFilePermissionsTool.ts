import { tool } from "langchain";
import { z } from "zod";
import { setFilePermissions } from "@/services/codeSandbox/fsOperations";

export const setFilePermissionsTool = tool(
  async ({ path, perms }) => setFilePermissions(path, perms),
  {
    name: "set_file_permissions",
    description: `Tool Name: set_file_permissions
What it does: Sets permission mode (e.g. '755' for executable scripts, '644' for standard files), owner, and group for a path in the sandbox workspace (/home/daytona/app).
When to use: Use when making shell scripts executable (mode: '755') or modifying file permission bits.
Input Format: JSON object { path?: string, perms?: { mode?: string, owner?: string, group?: string } } relative to app root.
Output Format:
  - On Success: String "Permissions updated successfully for /home/daytona/app/<path>"
  - On Error / Not Found: Throws DaytonaFileNotFoundError ("stat /home/daytona/app/<path>: no such file or directory").
Rules / Constraints:
  - Do NOT use for standard file creation or editing (use 'upload_file').`,
    schema: z.object({
      path: z.string().optional().describe("Path relative to app root (e.g. 'scripts/build.sh')."),
      perms: z
        .object({
          mode: z.string().optional().describe("Permission mode string (e.g. '755', '644', '600')."),
          owner: z.string().optional().describe("Owner username or ID."),
          group: z.string().optional().describe("Group name or ID."),
        })
        .optional().describe("Permission settings object."),
    }),
  },
);
