import {
  PtyHandle,
  type PtyCreateOptions,
  type PtyConnectOptions,
  type PtyResult,
} from "@daytona/sdk";
import type { PtySessionInfo } from "@daytona/toolbox-api-client";
import sandBox from "./index";

export type {
  PtyHandle,
  PtyCreateOptions,
  PtyConnectOptions,
  PtyResult,
  PtySessionInfo,
};

export interface InteractiveInputStep {
  delayMs: number;
  input: string;
}

export interface InteractivePtyCommandParams {
  id: string;
  command: string;
  inputs?: InteractiveInputStep[];
  cols?: number;
  rows?: number;
  cwd?: string;
  envs?: Record<string, string>;
  onData?: (data: Uint8Array) => void;
}

export interface LongRunningPtyProcessParams {
  id: string;
  command: string;
  durationMs: number;
  cols?: number;
  rows?: number;
  cwd?: string;
  envs?: Record<string, string>;
  onData?: (data: Uint8Array) => void;
}

/** Resolves a Daytona sandbox instance by ID. */
async function getSandbox(sandboxId: string) {
  return sandBox.get(sandboxId);
}

/** Creates a new interactive PTY terminal session in the sandbox. */
export async function createPty(
  sandboxId: string,
  options?: PtyCreateOptions & PtyConnectOptions,
): Promise<PtyHandle> {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.createPty(options);
}

/** Connects to an existing PTY session in the sandbox. */
export async function connectPty(
  sandboxId: string,
  sessionId: string,
  options?: PtyConnectOptions,
): Promise<PtyHandle> {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.connectPty(sessionId, options);
}

/** Lists all registered PTY sessions in the sandbox. */
export async function listPtySessions(
  sandboxId: string,
): Promise<PtySessionInfo[]> {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.listPtySessions();
}

/** Gets detailed information about a specific PTY session. */
export async function getPtySessionInfo(
  sandboxId: string,
  sessionId: string,
): Promise<PtySessionInfo> {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getPtySessionInfo(sessionId);
}

/** Kills a PTY session and terminates its shell process. */
export async function killPtySession(
  sandboxId: string,
  sessionId: string,
): Promise<void> {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.killPtySession(sessionId);
}

/** Resizes the terminal dimensions (cols x rows) for an active PTY session. */
export async function resizePtySession(
  sandboxId: string,
  sessionId: string,
  cols: number,
  rows: number,
): Promise<PtySessionInfo> {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.resizePtySession(sessionId, cols, rows);
}

/** Executes logic with automatic cleanup of PTY handle resources via try/finally. */
export async function withPtySession<T>(
  sandboxId: string,
  options: PtyCreateOptions & PtyConnectOptions,
  fn: (handle: PtyHandle) => Promise<T>,
): Promise<T> {
  let ptyHandle: PtyHandle | undefined;
  try {
    ptyHandle = await createPty(sandboxId, options);
    await ptyHandle.waitForConnection();
    return await fn(ptyHandle);
  } finally {
    if (ptyHandle) {
      await ptyHandle.kill().catch(() => {});
      await ptyHandle.disconnect().catch(() => {});
    }
  }
}

/** Runs interactive terminal commands with step-by-step timed inputs. */
export async function runInteractivePtyCommand(
  sandboxId: string,
  params: InteractivePtyCommandParams,
): Promise<PtyResult> {
  const ptyHandle = await createPty(sandboxId, {
    id: params.id,
    cwd: params.cwd,
    envs: params.envs,
    cols: params.cols,
    rows: params.rows,
    onData: params.onData ?? (() => {}),
  });

  await ptyHandle.waitForConnection();
  await ptyHandle.sendInput(params.command);

  if (params.inputs?.length) {
    for (const step of params.inputs) {
      if (step.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, step.delayMs));
      }
      await ptyHandle.sendInput(step.input);
    }
  }

  const result = await ptyHandle.wait();
  await ptyHandle.disconnect();
  return result;
}

/** Executes a process in a PTY session for a specific duration then terminates it. */
export async function runLongRunningPtyProcess(
  sandboxId: string,
  params: LongRunningPtyProcessParams,
): Promise<PtyResult> {
  const ptyHandle = await createPty(sandboxId, {
    id: params.id,
    cwd: params.cwd,
    envs: params.envs,
    cols: params.cols,
    rows: params.rows,
    onData: params.onData ?? (() => {}),
  });

  await ptyHandle.waitForConnection();
  await ptyHandle.sendInput(params.command);

  await new Promise((resolve) => setTimeout(resolve, params.durationMs));

  await ptyHandle.kill();
  const result = await ptyHandle.wait();
  await ptyHandle.disconnect();
  return result;
}

/** Throws an error if the PTY session exited with a non-zero exit code. */
export function handlePtyError(result: PtyResult): void {
  if (result.exitCode !== 0) {
    throw new Error(
      `PTY process failed with exit code ${result.exitCode ?? "unknown"}${
        result.error ? `: ${result.error}` : ""
      }`,
    );
  }
}
