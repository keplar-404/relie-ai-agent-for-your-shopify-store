import type { SessionCommandLogsResponse } from "@daytona/sdk";
import sandBox from "./index";

export type { SessionCommandLogsResponse };

export interface CodeRunParams {
  argv?: string[];
  env?: Record<string, string>;
  timeout?: number;
}

export interface SessionCommandRequest {
  command: string;
  runAsync?: boolean;
  suppressInputEcho?: boolean;
  cwd?: string;
  env?: Record<string, string>;
}

/** Resolves a Daytona sandbox instance by ID. */
async function getSandbox(sandboxId: string) {
  return sandBox.get(sandboxId);
}

/** Runs a code snippet in the sandbox using the default language runtime. */
export async function codeRunStateless(
  sandboxId: string,
  code: string,
  params?: CodeRunParams,
  timeoutOverride?: number,
) {
  const sandbox = await getSandbox(sandboxId);

  return sandbox.process.codeRun(
    code,
    params ?? undefined,
    timeoutOverride ?? params?.timeout ?? undefined,
  );
}

/** Executes a shell command inside the sandbox process. */
export async function runShellCommand(
  sandboxId: string,
  command: string,
  cwd = ".",
  env?: Record<string, string>,
  timeout?: number,
) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.executeCommand(command, cwd, env, timeout);
}

/** Creates a new Python interpreter context in the sandbox. */
export async function createCodeInterpreterContext(sandboxId: string, cwd?: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.codeInterpreter.createContext(cwd);
}

/** Lists all Python interpreter contexts created in the sandbox. */
export async function listCodeInterpreterContexts(sandboxId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.codeInterpreter.listContexts();
}

/** Deletes a Python interpreter context and stops its process. */
export async function deleteCodeInterpreterContext(
  sandboxId: string,
  context: any,
) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.codeInterpreter.deleteContext(context);
}

/** Runs Python code inside an existing interpreter context. */
export async function runCodeInContext(
  sandboxId: string,
  code: string,
  context?: any,
  options?: {
    envs?: Record<string, string>;
    timeout?: number;
    onStdout?: (message: any) => void;
    onStderr?: (message: any) => void;
    onError?: (error: any) => void;
  },
) {
  const sandbox = await getSandbox(sandboxId);

  return sandbox.codeInterpreter.runCode(code, {
    context,
    envs: options?.envs,
    timeout: options?.timeout,
    onStdout: options?.onStdout,
    onStderr: options?.onStderr,
    onError: options?.onError,
  });
}

/** Creates a long-running shell session in the sandbox. */
export async function createSession(sandboxId: string, sessionId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.createSession(sessionId);
}

/** Lists all active sessions in the sandbox. */
export async function listSessions(sandboxId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.listSessions();
}

/** Fetches session details and command history. */
export async function getSession(sandboxId: string, sessionId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getSession(sessionId);
}

/** Gets details for a single command executed inside a session. */
export async function getSessionCommand(
  sandboxId: string,
  sessionId: string,
  commandId: string,
) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getSessionCommand(sessionId, commandId);
}

/** Gets details for the sandbox entrypoint session. */
export async function getEntrypointSession(sandboxId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getEntrypointSession();
}

/** Retrieves snapshot stdout/stderr logs from the entrypoint session. */
export async function getEntrypointLogs(sandboxId: string): Promise<SessionCommandLogsResponse> {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getEntrypointLogs();
}

/** Streams stdout and stderr logs from the entrypoint session in real time. */
export async function streamEntrypointLogs(
  sandboxId: string,
  onStdout: (chunk: string) => void,
  onStderr: (chunk: string) => void,
): Promise<void> {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getEntrypointLogs(onStdout, onStderr);
}

/** Executes a command inside an existing session while maintaining state. */
export async function executeSessionCommand(
  sandboxId: string,
  sessionId: string,
  request: SessionCommandRequest,
  timeout?: number,
) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.executeSessionCommand(sessionId, request as any, timeout);
}

/** Retrieves snapshot logs produced so far for a session command. */
export async function getSessionCommandLogs(
  sandboxId: string,
  sessionId: string,
  commandId: string,
): Promise<SessionCommandLogsResponse> {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getSessionCommandLogs(sessionId, commandId);
}

/** Streams stdout and stderr logs for a session command in real time. */
export async function streamSessionCommandLogs(
  sandboxId: string,
  sessionId: string,
  commandId: string,
  onStdout: (chunk: string) => void,
  onStderr: (chunk: string) => void,
): Promise<void> {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getSessionCommandLogs(sessionId, commandId, onStdout, onStderr);
}

/** Sends stdin user input to a command running in a session. */
export async function sendSessionCommandInput(
  sandboxId: string,
  sessionId: string,
  commandId: string,
  data: string,
) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.sendSessionCommandInput(sessionId, commandId, data);
}

/** Deletes a session and releases its resources. */
export async function deleteSession(sandboxId: string, sessionId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.deleteSession(sessionId);
}
