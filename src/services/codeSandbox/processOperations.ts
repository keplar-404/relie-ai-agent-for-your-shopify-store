import sandBox from "./index";

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

async function getSandbox(sandboxId: string) {
  return sandBox.get(sandboxId);
}

/**
 * Runs a code snippet in the sandbox using the default language runtime.
 * Useful for one-off JavaScript/TypeScript/Python execution in a clean state.
 */
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

/**
 * Runs code with CLI arguments and environment variables.
 * Good for scripts that need process.argv or custom env values.
 */
export async function codeRunWithArgs(
  sandboxId: string,
  code: string,
  argv: string[],
  env?: Record<string, string>,
  timeout?: number,
) {
  return codeRunStateless(sandboxId, code, { argv, env, timeout }, timeout);
}

/**
 * Executes a shell command inside the sandbox using the sandbox process API.
 * Accepts a working directory, environment overrides, and timeout.
 */
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

/**
 * Runs a simple shell command with a default timeout and current directory.
 */
export async function runShellCommandSimple(sandboxId: string, command: string) {
  return runShellCommand(sandboxId, command, ".", undefined, 10);
}

/**
 * Creates a new Python interpreter context in the sandbox.
 * Use this when you want stateful execution isolated from other code runs.
 */
export async function createCodeInterpreterContext(sandboxId: string, cwd?: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.codeInterpreter.createContext(cwd);
}

/**
 * Lists all user-created Python interpreter contexts in the sandbox.
 */
export async function listCodeInterpreterContexts(sandboxId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.codeInterpreter.listContexts();
}

/**
 * Deletes an interpreter context and shuts down its worker process.
 */
export async function deleteCodeInterpreterContext(
  sandboxId: string,
  context: any,
) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.codeInterpreter.deleteContext(context);
}

/**
 * Runs Python code inside an existing interpreter context.
 * Keeps state between calls when a context is reused.
 */
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

/**
 * Creates a long-running shell session in the sandbox.
 * Useful for multiple related commands that should share state.
 */
export async function createSession(sandboxId: string, sessionId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.createSession(sessionId);
}

/**
 * Lists all active sessions in the sandbox.
 */
export async function listSessions(sandboxId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.listSessions();
}

/**
 * Fetches metadata for a specific session, including its commands and status.
 */
export async function getSession(sandboxId: string, sessionId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getSession(sessionId);
}

/**
 * Gets details for one command executed inside a session.
 */
export async function getSessionCommand(
  sandboxId: string,
  sessionId: string,
  commandId: string,
) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getSessionCommand(sessionId, commandId);
}

/**
 * Returns the sandbox entrypoint session so you can inspect the app startup process.
 */
export async function getEntrypointSession(sandboxId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getEntrypointSession();
}

/**
 * Fetches stdout/stderr logs from the sandbox entrypoint session.
 */
export async function getEntrypointLogs(sandboxId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getEntrypointLogs();
}

/**
 * Executes a command inside an existing session while preserving state.
 */
export async function executeSessionCommand(
  sandboxId: string,
  sessionId: string,
  request: SessionCommandRequest,
  timeout?: number,
) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.executeSessionCommand(sessionId, request as any, timeout);
}

/**
 * Reads the output logs for a command that was run in a session.
 */
export async function getSessionCommandLogs(
  sandboxId: string,
  sessionId: string,
  commandId: string,
) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.getSessionCommandLogs(sessionId, commandId);
}

/**
 * Sends user input to an interactive session command that is waiting for stdin.
 */
export async function sendSessionCommandInput(
  sandboxId: string,
  sessionId: string,
  commandId: string,
  data: string,
) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.sendSessionCommandInput(sessionId, commandId, data);
}

/**
 * Deletes a session and releases the sandbox session resources.
 */
export async function deleteSession(sandboxId: string, sessionId: string) {
  const sandbox = await getSandbox(sandboxId);
  return sandbox.process.deleteSession(sessionId);
}

export const daytonaProcessApi = {
  codeRunStateless,
  codeRunWithArgs,
  runShellCommand,
  runShellCommandSimple,
  createCodeInterpreterContext,
  listCodeInterpreterContexts,
  deleteCodeInterpreterContext,
  runCodeInContext,
  createSession,
  listSessions,
  getSession,
  getSessionCommand,
  getEntrypointSession,
  getEntrypointLogs,
  executeSessionCommand,
  getSessionCommandLogs,
  sendSessionCommandInput,
  deleteSession,
};

export default daytonaProcessApi;
