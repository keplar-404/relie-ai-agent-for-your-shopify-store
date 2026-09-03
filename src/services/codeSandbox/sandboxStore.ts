import sandBox from "./index";
import type { Sandbox } from "@daytona/sdk";

let activeSandboxInstance: Sandbox | null = null;
let activeSandboxId: string | null = null;

export function setActiveSandbox(sandbox: Sandbox) {
  activeSandboxInstance = sandbox;
  activeSandboxId = sandbox.id;
}

export function setActiveSandboxId(id: string) {
  if (activeSandboxId !== id) {
    activeSandboxId = id;
    activeSandboxInstance = null;
  }
}

export function getActiveSandboxId(): string | null {
  return activeSandboxId;
}

export async function getActiveSandbox(): Promise<Sandbox> {
  if (activeSandboxInstance) {
    return activeSandboxInstance;
  }
  if (activeSandboxId) {
    activeSandboxInstance = await sandBox.get(activeSandboxId);
    return activeSandboxInstance;
  }
  throw new Error("No active sandbox available. Create a sandbox first.");
}

