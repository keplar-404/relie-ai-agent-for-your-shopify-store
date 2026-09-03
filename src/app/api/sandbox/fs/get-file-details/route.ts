import { NextResponse } from "next/server";
import { getFileDetails } from "@/services/codeSandbox/fsOperations";
import { setActiveSandboxId } from "@/services/codeSandbox/sandboxStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, sandboxId } = body;
    if (sandboxId) setActiveSandboxId(sandboxId);

    const data = await getFileDetails(path);
    return NextResponse.json({ success: true, details: data });
  } catch (error) {
    console.error("[API: fs/get-file-details] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to get file details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

