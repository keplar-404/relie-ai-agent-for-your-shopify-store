import sandBox from "../index";

/** Runs TypeScript type checking ('npx tsc --noEmit') inside the Daytona sandbox. */
export async function runTypecheck(sandboxId: string, cwd = ".") {
  const sandbox = await sandBox.get(sandboxId);
  return sandbox.process.executeCommand("npx tsc --noEmit", cwd);
}
