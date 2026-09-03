import { NextResponse } from "next/server";
import { setFilePermissions } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, perms, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    const message = await setFilePermissions(path, perms || {});
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("[API: fs/set-file-permissions] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to set file permissions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
