import type { SessionCommandLogsResponse } from "@daytona/sdk";
import sandBox from "../index";

/** Fetches entrypoint/server console logs from the Daytona sandbox. */
export async function getConsoleLogs(sandboxId: string): Promise<SessionCommandLogsResponse> {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.process.getEntrypointLogs();
}
