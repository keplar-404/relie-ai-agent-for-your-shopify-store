import { NextResponse } from "next/server";
import { deleteFile } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, recursive, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    const message = await deleteFile(path, recursive ?? false);
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("[API: fs/delete-file] Error:", error);
    const errMessage = error instanceof Error ? error.message : "Failed to delete file";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

