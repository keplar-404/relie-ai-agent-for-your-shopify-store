import { NextResponse } from "next/server";
import { createFolder } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    const result = await createFolder(path);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[API: fs/create-folder] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create folder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

