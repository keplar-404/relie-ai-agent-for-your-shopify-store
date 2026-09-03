import { NextResponse } from "next/server";
import { listFs } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    const data = await listFs(path);
    return NextResponse.json({ success: true, files: data });
  } catch (error) {
    console.error("[API: fs/list] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to list filesystem";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

