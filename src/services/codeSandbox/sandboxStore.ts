import sandBox from "./index";

let cachedSandbox: any = null;
let cachedSandboxId: string | null = null;

export function setActiveSandbox(sandbox: any) {
  cachedSandbox = sandbox;
  if (sandbox?.id) {
    cachedSandboxId = sandbox.id;
  }
}

export function setActiveSandboxId(id: string | null) {
  if (cachedSandboxId !== id) {
    cachedSandboxId = id;
    cachedSandbox = null; // reset cached instance when ID changes
  }
}

export function getActiveSandboxId(): string | null {
  return cachedSandboxId;
}

export async function getActiveSandbox(): Promise<any> {
  if (cachedSandbox) {
    return cachedSandbox;
  }

  if (cachedSandboxId) {
    cachedSandbox = await sandBox.get(cachedSandboxId);
    return cachedSandbox;
  }

  return null;
}
