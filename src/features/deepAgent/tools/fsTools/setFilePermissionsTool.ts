import { tool } from "langchain";
import { z } from "zod";
import { setFilePermissions } from "@/services/codeSandbox/fsOperations";

export const setFilePermissionsTool = tool(
  async ({ path, perms }) => setFilePermissions(path, perms),
  {
    name: "set_file_permissions",
    description: `Set permission mode (e.g. '755' or '644'), file owner, and group for a file or directory in the sandbox workspace.

WHEN TO USE:
- Use to make shell scripts executable ('755') or adjust file permissions.

EXAMPLES & SCENARIOS:
Scenario 1: Making a build script executable.
  Call: set_file_permissions({ path: "scripts/build.sh", perms: { mode: "755" } })`,
    schema: z.object({
      path: z.string().optional().describe("Path relative to app root (e.g. 'scripts/build.sh')."),
      perms: z
        .object({
          mode: z.string().optional().describe("Permission mode (e.g. '755', '644')."),
          owner: z.string().optional().describe("Owner username or ID."),
          group: z.string().optional().describe("Group name or ID."),
        })
        .optional().describe("Permission settings."),
    }),
  },
);
